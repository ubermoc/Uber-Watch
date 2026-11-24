# Copyright (c) 2026 ubermoc. All rights reserved. See LICENSE.
"""Decky backend: Uber Watch: controls the watchdog (a user service) and the local model. Runs as the desktop user."""

import asyncio
import json
import os
import pwd
import re
import ssl
import subprocess
import urllib.request
import zipfile

import decky

PLUGIN_NAME = "Uber Watch"
PLUGIN_REPO = "ubermoc/Uber-Watch"
PLUGIN_ASSET = "Uber-Watch.zip"
PLUGIN_FILES = ("plugin.json", "package.json", "main.py", "dist/index.js")
UNIT = "strata-watchdog.service"
HOME = decky.DECKY_USER_HOME
STRATA = os.path.join(HOME, ".local/bin/strata")
STATE_DIR = os.path.join(HOME, ".local/state/strata")
STATE = os.path.join(STATE_DIR, "tray-state.json")  # shared with the tray icon
NO_RESUME = os.path.join(STATE_DIR, "no-resume")  # no resume after a model restart or a crash
NO_RESUME_BOOT = os.path.join(STATE_DIR, "no-resume-reboot")  # no resume after a reboot or a restart of the watchdog
LOG = os.path.join(STATE_DIR, "watchdog.log")


def _env():
    env = dict(os.environ)
    env["HOME"] = HOME
    env["XDG_RUNTIME_DIR"] = f"/run/user/{pwd.getpwnam(decky.DECKY_USER).pw_uid}"
    env["DBUS_SESSION_BUS_ADDRESS"] = f"unix:path={env['XDG_RUNTIME_DIR']}/bus"
    return env


def _pw():
    return pwd.getpwnam(decky.DECKY_USER)


def _run(args, timeout=30):
    """Runs as the desktop user (this plugin runs as root so it can replace its own files)."""
    if os.geteuid() == 0:
        args = ["runuser", "-u", decky.DECKY_USER, "--", "env",
                f"HOME={HOME}", f"XDG_RUNTIME_DIR={_env()['XDG_RUNTIME_DIR']}",
                f"DBUS_SESSION_BUS_ADDRESS={_env()['DBUS_SESSION_BUS_ADDRESS']}", *args]
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, env=_env())


def _own(path):
    """Files made by this (root) backend belong to the desktop user, so the tray and the watchdog can change them."""
    try:
        pw = _pw()
        os.chown(path, pw.pw_uid, pw.pw_gid)
    except OSError:
        pass


def _sc(*a):
    return _run(["systemctl", "--user", *a])


def _state():
    try:
        with open(STATE) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _save(**kw):
    s = _state()
    s.update(kw)
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(STATE, "w") as f:
        json.dump(s, f)
    _own(STATE)


def _service_preset():
    for part in _sc("show", UNIT, "-p", "Environment").stdout.replace("Environment=", "").split():
        if part.startswith("STRATA_PRESET="):
            return part.split("=", 1)[1]
    return None


def _model():
    try:
        out = _run([STRATA, "launch", "--status"], 20).stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return None, "unknown"
    line = out.splitlines()[0] if out else ""
    if ":" in line and "Nothing" not in line:
        return line.split(":", 1)[0].strip(), line.split(":", 1)[1].strip().split(" at ")[0]
    return None, "not loaded"


def _last_log():
    try:
        with open(LOG, "rb") as f:
            f.seek(0, 2)
            f.seek(max(0, f.tell() - 4000))
            lines = f.read().decode(errors="replace").strip().splitlines()
        return lines[-1][:90] if lines else ""
    except OSError:
        return ""


class Plugin:
    busy = ""

    async def _main(self):
        decky.logger.info("started")

    async def _unload(self):
        pass

    async def _off(self, fn, *a):
        return await asyncio.get_running_loop().run_in_executor(None, fn, *a)

    async def status(self) -> dict:
        def work():
            preset, text = _model()
            if preset:
                _save(last_preset=preset)
            return {
                "watching": _sc("is-active", UNIT).stdout.strip() == "active",
                "loaded": preset is not None,
                "model": text,
                "preset": preset,
                "no_resume": os.path.exists(NO_RESUME),
                "no_resume_boot": os.path.exists(NO_RESUME_BOOT),
                "busy": Plugin.busy,
                "log": _last_log(),
            }
        return await self._off(work)

    async def pause(self) -> dict:
        def work():
            _sc("stop", UNIT)
            _save(paused_by_unload=False)
            return {"ok": True}
        return await self._off(work)

    async def resume(self) -> dict:
        def work():
            _sc("start", UNIT)
            _save(paused_by_unload=False)
            return {"ok": True}
        return await self._off(work)

    async def set_no_resume(self, on: bool, boot: bool = False) -> dict:
        def work():
            flag = NO_RESUME_BOOT if boot else NO_RESUME
            os.makedirs(STATE_DIR, exist_ok=True)
            if on:
                open(flag, "w").close()
                _own(flag)
            elif os.path.exists(flag):
                os.remove(flag)
            return {"ok": True}
        return await self._off(work)

    # ---------- the plugin itself ----------
    @staticmethod
    def _version_tuple(text):
        return tuple(int(n) for n in re.findall(r"\d+", text)[:3])

    @staticmethod
    def _installed_version():
        try:
            with open(os.path.join(decky.DECKY_PLUGIN_DIR, "package.json")) as f:
                return json.load(f).get("version", "unknown")
        except (OSError, ValueError):
            return "unknown"

    @staticmethod
    def _ctx():
        for path in ("/etc/ssl/certs/ca-certificates.crt", "/etc/ca-certificates/extracted/tls-ca-bundle.pem", "/etc/ssl/cert.pem"):
            if os.path.exists(path):
                return ssl.create_default_context(cafile=path)
        return ssl.create_default_context()

    def _latest_release(self):
        req = urllib.request.Request(f"https://api.github.com/repos/{PLUGIN_REPO}/releases/latest",
                                     headers={"User-Agent": "uber-watch", "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(req, context=self._ctx(), timeout=20) as r:
            return json.loads(r.read().decode())

    async def check_update(self) -> dict:
        current = self._installed_version()
        try:
            rel = await self._off(self._latest_release)
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "current": current, "error": "Couldn't reach GitHub."}
        latest = rel.get("tag_name", "").lstrip("v")
        return {"ok": True, "current": current, "latest": latest,
                "available": self._version_tuple(latest) > self._version_tuple(current)}

    async def install_update(self) -> dict:
        def work():
            rel = self._latest_release()
            asset = next((a for a in rel.get("assets", []) if a.get("name") == PLUGIN_ASSET), None)
            if asset is None:
                return {"ok": False, "error": "The latest release has no plugin zip."}
            req = urllib.request.Request(asset["browser_download_url"], headers={"User-Agent": "uber-watch"})
            tmp = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, PLUGIN_ASSET)
            os.makedirs(decky.DECKY_PLUGIN_RUNTIME_DIR, exist_ok=True)
            with urllib.request.urlopen(req, context=self._ctx(), timeout=120) as r, open(tmp, "wb") as out:
                out.write(r.read())
            prefix = PLUGIN_NAME + "/"
            with zipfile.ZipFile(tmp) as z:
                if z.testzip() is not None:
                    return {"ok": False, "error": "The update download is damaged."}
                names = z.namelist()
                if any(".." in n.split("/") or n.startswith("/") for n in names):
                    return {"ok": False, "error": "The update contains an unsafe path."}
                if any(prefix + f not in names for f in PLUGIN_FILES):
                    return {"ok": False, "error": "The update is missing files."}
                if json.loads(z.read(prefix + "plugin.json")).get("name") != PLUGIN_NAME:
                    return {"ok": False, "error": "The update is for a different plugin."}
                for m in z.infolist():
                    if not m.filename.startswith(prefix) or m.is_dir():
                        continue
                    dest = os.path.join(decky.DECKY_PLUGIN_DIR, m.filename[len(prefix):])
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    with open(dest + ".new", "wb") as out:
                        out.write(z.read(m))
                    os.replace(dest + ".new", dest)
            return {"ok": True, "version": rel.get("tag_name", "").lstrip("v")}
        try:
            return await self._off(work)
        except Exception:  # noqa: BLE001
            decky.logger.exception("update failed")
            return {"ok": False, "error": "The update failed. Try again."}

    async def unload(self) -> dict:
        def work():
            preset = _model()[0] or _service_preset()
            was_on = _sc("is-active", UNIT).stdout.strip() == "active"
            _sc("stop", UNIT)  # first: a running watchdog would load the model again
            _save(last_preset=preset, paused_by_unload=was_on)
            Plugin.busy = "Unloading"
            try:
                _run(["timeout", "60", STRATA, "launch", "--stop"] + (["--preset", preset] if preset else []), 70)
                subprocess.run(["pkill", "-TERM", "-f", "components/engine/[^ ]*/strata --serve"])
            finally:
                Plugin.busy = ""
            return {"ok": True}
        return await self._off(work)

    async def reload(self) -> dict:
        def work():
            st = _state()
            preset = st.get("last_preset") or _service_preset()
            if not preset:
                return {"ok": False, "error": "No earlier model to reload."}
            Plugin.busy = "Loading"
            try:
                r = _run(["timeout", "600", STRATA, "launch", "--preset", preset, "--tune", "skip", "--no-tui", "--yes"], 620)
            finally:
                Plugin.busy = ""
            if r.returncode != 0:
                return {"ok": False, "error": f"Loading failed (exit {r.returncode})."}
            if _state().get("paused_by_unload"):
                _sc("start", UNIT)
                _save(paused_by_unload=False)
            return {"ok": True}
        return await self._off(work)
