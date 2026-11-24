# Copyright (c) 2026 ubermoc. All rights reserved. See LICENSE.
"""Decky backend: Uber Watch: controls the watchdog (a user service) and the local model. Runs as the desktop user."""

import asyncio
import json
import os
import pwd
import subprocess

import decky

UNIT = "strata-watchdog.service"
HOME = decky.DECKY_USER_HOME
STRATA = os.path.join(HOME, ".local/bin/strata")
STATE_DIR = os.path.join(HOME, ".local/state/strata")
STATE = os.path.join(STATE_DIR, "tray-state.json")  # shared with the tray icon
NO_RESUME = os.path.join(STATE_DIR, "no-resume")
LOG = os.path.join(STATE_DIR, "watchdog.log")


def _env():
    env = dict(os.environ)
    env["HOME"] = HOME
    env["XDG_RUNTIME_DIR"] = f"/run/user/{pwd.getpwnam(decky.DECKY_USER).pw_uid}"
    env["DBUS_SESSION_BUS_ADDRESS"] = f"unix:path={env['XDG_RUNTIME_DIR']}/bus"
    return env


def _run(args, timeout=30):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, env=_env())


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

    async def set_no_resume(self, on: bool) -> dict:
        def work():
            os.makedirs(STATE_DIR, exist_ok=True)
            if on:
                open(NO_RESUME, "w").close()
            elif os.path.exists(NO_RESUME):
                os.remove(NO_RESUME)
            return {"ok": True}
        return await self._off(work)

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
