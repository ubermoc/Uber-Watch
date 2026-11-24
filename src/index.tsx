import { ButtonItem, Navigation, PanelSection, PanelSectionRow, ToggleField, staticClasses } from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { useEffect, useState } from "react";
import { FaShieldAlt } from "react-icons/fa";

type Status = {
  watching: boolean; loaded: boolean; model: string; preset: string | null;
  no_resume: boolean; busy: string; log: string;
};
type Result = { ok: boolean; error?: string };

const status = callable<[], Status>("status");
const pause = callable<[], Result>("pause");
const resume = callable<[], Result>("resume");
const unload = callable<[], Result>("unload");
const reload = callable<[], Result>("reload");
const setNoResume = callable<[boolean], Result>("set_no_resume");

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
          <ToggleField label="Don't resume sessions by itself" checked={!!s?.no_resume}
            description="On: after a restart or reboot, cut-off sessions stay stopped until you continue them."
            onChange={(v: boolean) => act(() => setNoResume(v))} />
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
      {(msg || s?.log) && (
        <PanelSection>
          <PanelSectionRow><div style={{ fontSize: "12px", opacity: 0.7 }}>{msg || s?.log}</div></PanelSectionRow>
        </PanelSection>
      )}
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
