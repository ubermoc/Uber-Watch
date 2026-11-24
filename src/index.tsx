import { ButtonItem, Field, Navigation, PanelSection, PanelSectionRow, ToggleField, staticClasses } from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { useEffect, useState } from "react";
import { FaShieldAlt } from "react-icons/fa";

type Status = {
  watching: boolean; loaded: boolean; model: string; preset: string | null;
  no_resume: boolean; no_resume_boot: boolean; busy: string; log: string;
};
type Result = { ok: boolean; error?: string };

const status = callable<[], Status>("status");
const pause = callable<[], Result>("pause");
const resume = callable<[], Result>("resume");
const unload = callable<[], Result>("unload");
const reload = callable<[], Result>("reload");
type UpdateInfo = { ok: boolean; current: string; latest?: string; available?: boolean; error?: string };
const checkUpdate = callable<[], UpdateInfo>("check_update");
const installUpdate = callable<[], Result & { version?: string }>("install_update");

// Decky's own routes (not a documented plugin API), so a missing global ends in a clear message.
function deckyCall(route: string, ...args: unknown[]): Promise<unknown> {
  const backend = (window as unknown as { DeckyBackend?: { call: (r: string, ...a: unknown[]) => Promise<unknown> } }).DeckyBackend;
  if (!backend?.call) throw new Error("This version of Decky can't reload plugins.");
  return backend.call(route, ...args);
}

function PluginUpdate() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restart, setRestart] = useState(false);
  useEffect(() => { checkUpdate().then(setInfo).catch(() => setError("Couldn't check for updates.")); }, []);
  const update = async () => {
    setBusy(true); setError("");
    try {
      const r = await installUpdate();
      if (!r.ok) throw new Error(r.error ?? "The update failed.");
      await deckyCall("loader/reload_plugin", "Uber Watch");
      setTimeout(() => { setBusy(false); setRestart(true); }, 45000);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setBusy(false); setRestart(true); }
  };
  return (
    <PanelSection title="Plugin update">
      <PanelSectionRow><Field label="Current version" bottomSeparator="none">{info?.current ?? "..."}</Field></PanelSectionRow>
      <PanelSectionRow><Field label="Latest version" bottomSeparator="none">{info ? info.latest || "unknown" : "..."}</Field></PanelSectionRow>
      {(error || info?.error) && <PanelSectionRow><div style={{ fontSize: "12px", opacity: 0.7 }}>{error || info?.error}</div></PanelSectionRow>}
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={busy || !info?.available} onClick={update}>
          {busy ? "Updating..." : info?.available ? "Update" : "Up to date"}
        </ButtonItem>
      </PanelSectionRow>
      {restart && (
        <PanelSectionRow>
          <ButtonItem layout="below" description="Didn't update? This restarts Decky and Steam's interface."
            onClick={() => { try { deckyCall("updater/do_restart"); } catch { /* shown above next time */ } }}>Restart Decky Loader</ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

const setNoResume = callable<[boolean, boolean], Result>("set_no_resume");

const APPS: { name: string; what: string; url: string }[] = [
  { name: "Uber Watch for the desktop", what: "The same watchdog with a tray icon, for your Linux desktop.", url: "https://github.com/ubermoc/Uber-Watch-Desktop" },
  { name: "Ubermoc Speech", what: "Hold a button, speak, and your words are typed into any app.", url: "https://github.com/ubermoc/Ubermoc-Speech" },
  { name: "Ubermoc Warcraft Mod Updater", what: "Updates the Ubermoc addons for World of Warcraft.", url: "https://github.com/ubermoc/Ubermoc-Warcraft-Mod-Updater" },
];

function Content() {
  const [more, setMore] = useState(false);
  const [s, setS] = useState<Status | null>(null);
  const [msg, setMsg] = useState("");
  const [working, setWorking] = useState(false);

  const refresh = async () => { try { setS(await status()); } catch { setMsg("The plugin did not answer."); } };
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, []);

  const act = async (fn: () => Promise<Result>) => {
    setWorking(true); setMsg("");
    try { const r = await fn(); if (!r.ok) setMsg(r.error ?? "Failed."); } catch { setMsg("Failed."); }
    setWorking(false); refresh();
  };
  const off = working || !!s?.busy;

  return (
    <>
      <PanelSection title="Uber Watch">
        <PanelSectionRow><div>{s ? (s.watching ? "Watching" : "Paused") : "Checking..."}</div></PanelSectionRow>
        <PanelSectionRow>
          {s?.watching
            ? <ButtonItem layout="below" disabled={off} onClick={() => act(pause)}
                description="Stops watching. The model keeps running, but nothing restarts it if it fails.">Pause Uber Watch</ButtonItem>
            : <ButtonItem layout="below" disabled={off} onClick={() => act(resume)}
                description="Starts watching again: restarts the model if it fails and continues cut-off sessions.">Resume Uber Watch</ButtonItem>}
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Don't resume after a reboot" checked={!!s?.no_resume_boot}
            description="On: after a reboot or logout, sessions stay stopped until you continue them."
            onChange={(v: boolean) => act(() => setNoResume(v, true))} />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Don't resume cut-off sessions" checked={!!s?.no_resume}
            description="On: after a model restart or a crash, cut-off sessions stay stopped."
            onChange={(v: boolean) => act(() => setNoResume(v, false))} />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Model">
        <PanelSectionRow><div>{s?.busy ? s.busy + "..." : s ? s.model : "Checking..."}</div></PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={off || !s?.loaded} onClick={() => act(unload)}
            description="Unloads the model to free memory and pauses Uber Watch, so it doesn't load the model again.">Unload model</ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={off || !!s?.loaded} onClick={() => act(reload)}
            description="Loads the last model again. If Unload paused Uber Watch, it starts watching again.">Reload model</ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      {(msg || s?.log) && (
        <PanelSection>
          <PanelSectionRow><div style={{ fontSize: "12px", opacity: 0.7 }}>{msg || s?.log}</div></PanelSectionRow>
        </PanelSection>
      )}
      <PluginUpdate />
      <PanelSection title="More from Ubermoc">
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setMore(!more)}>
            {more ? "Hide the list" : "Downloads: more Uber apps for game mode"}
          </ButtonItem>
        </PanelSectionRow>
        {more && APPS.map((a) => (
          <PanelSectionRow {...({ key: a.url } as object)}>
            <ButtonItem layout="below" description={a.what} onClick={() => Navigation.NavigateToExternalWeb(a.url)}>
              {a.name}
            </ButtonItem>
          </PanelSectionRow>
        ))}
      </PanelSection>
    </>
  );
}

export default definePlugin(() => ({
  name: "Uber Watch",
  titleView: <div className={staticClasses.Title}>Uber Watch</div>,
  content: <Content />,
  icon: <FaShieldAlt />,
  onDismount() {},
}));
