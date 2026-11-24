# Ubermoc Watchdog (game mode plugin)

A Decky Loader plugin for the Steam Deck's game mode. Open the Quick Access menu, then the plug icon:

- **Watchdog**: shows watching or paused; Pause / Resume.
- **Don't resume sessions by itself**: when on, the watchdog never continues cut-off sessions.
- **Model**: shows the loaded model; Unload model (also pauses the watchdog) and Reload model (loads the last one and resumes the watchdog if Unload paused it).

It does the same as the tray icon on the desktop and shares its state file (`~/.local/state/strata/tray-state.json`) and the no-resume switch (`~/.local/state/strata/no-resume`).

## Install
```bash
cd ~/Downloads/Projects/Ubermoc-Watchdog-Plugin && bash install.sh
```
(asks for sudo once; the plugins folder belongs to root, and Decky is restarted).

## Build
```bash
npm install && npm run build
```
