import { ButtonItem, PanelSection, PanelSectionRow, ToggleField, staticClasses } from "@decky/ui";
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

function Content() {
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
      <PanelSection title="Watchdog">
        <PanelSectionRow><div>{s ? (s.watching ? "Watching" : "Paused") : "Checking..."}</div></PanelSectionRow>
        <PanelSectionRow>
          {s?.watching
            ? <ButtonItem layout="below" disabled={off} onClick={() => act(pause)}>Pause watchdog</ButtonItem>
            : <ButtonItem layout="below" disabled={off} onClick={() => act(resume)}>Resume watchdog</ButtonItem>}
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField label="Don't resume sessions by itself" checked={!!s?.no_resume}
            onChange={(v: boolean) => act(() => setNoResume(v))} />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Model">
        <PanelSectionRow><div>{s?.busy ? s.busy + "..." : s ? s.model : "Checking..."}</div></PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={off || !s?.loaded} onClick={() => act(unload)}>Unload model</ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={off || !!s?.loaded} onClick={() => act(reload)}>Reload model</ButtonItem>
        </PanelSectionRow>
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
  name: "Ubermoc Watchdog",
  titleView: <div className={staticClasses.Title}>Ubermoc Watchdog</div>,
  content: <Content />,
  icon: <FaShieldAlt />,
  onDismount() {},
}));
