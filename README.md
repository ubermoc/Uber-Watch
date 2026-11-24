# Uber Watch

Keeps your local model server up, with buttons for it in **game mode** (this Decky Loader plugin).

> **Want it on your Linux desktop too?** Use [Uber Watch for the desktop](https://github.com/ubermoc/Uber-Watch-Desktop): the watchdog itself and a tray icon. This panel controls the watchdog that the desktop version installs.

Built for the Strata local model server on Linux (Steam Deck and other handhelds included). Works with any setup where the model is started by `strata launch --preset <name>`.

![Game mode panel](images/game-mode-panel.png)
*The picture is a rendering of the real panel and its labels, not a screen capture.*

## What it does

- **Watches the model.** Every 20 seconds it asks the server for its model list. After about a minute of failed checks, or right after a GPU reset, it stops the old process and loads the preset again. It gives up for 10 minutes after 5 restarts in an hour.
- **Continues what was cut off.** When the model is back, when the service starts (after a reboot or logout), and when a watched service comes back after a crash, it continues every agent session whose last turn was cut off. A session you stopped yourself with Esc is left alone, and so is one that was continued in the last 10 minutes.
- **Keeps your services up** (optional). List user services in `UBER_WATCH_UNITS` and it starts any that are stopped.
- **Buttons.** Pause / Resume (a pause lasts across reboots and between desktop and game mode), Unload model (also pauses, or the watchdog would load it again), Reload model (loads the last preset and resumes if Unload paused it), and two switches: no resume after a reboot, no resume of cut-off sessions.

## The buttons, in plain words

| Option | What it does |
|---|---|
| Pause Uber Watch | Stops watching, even after a reboot or a mode switch, until you resume. The model keeps running, but nothing restarts it if it fails. |
| Resume Uber Watch | Starts watching again: restarts the model if it fails and continues cut-off sessions. |
| Don't resume after a reboot | On: after a reboot or logout, sessions stay stopped until you continue them. |
| Don't resume cut-off sessions | On: after a model restart or a crash, cut-off sessions stay stopped. |
| Unload model | Unloads the model to free memory **and pauses Uber Watch**, so it doesn't load the model again. |
| Reload model | Loads the last model again. If Unload paused Uber Watch, it **starts watching again**. |

## Install

**Game mode panel** (needs Decky Loader; asks for sudo once):

```bash
git clone https://github.com/ubermoc/Uber-Watch && cd Uber-Watch && bash install.sh
```

Or download the zip from the latest release and unpack it into `~/homebrew/plugins/`, then restart Decky.

The watchdog this panel controls comes with [Uber Watch for the desktop](https://github.com/ubermoc/Uber-Watch-Desktop); install that first.

## Files it uses

| File | Purpose |
|---|---|
| `~/.local/state/strata/watchdog.log` | what the watchdog did |
| `~/.local/state/strata/tray-state.json` | the last loaded preset (shared by the tray and the panel) |
| `~/.local/state/strata/paused` | exists = paused: the watchdog idles and loads nothing, across reboots and mode switches (shared by the tray and the panel) |
| `~/.local/state/strata/no-resume` | exists = do not continue cut-off sessions after a model restart or a crash |
| `~/.local/state/strata/no-resume-reboot` | exists = do not continue sessions after a reboot, a logout or a restart of the watchdog |

## Updating

At the bottom of the panel, **Plugin update** shows the installed and the latest version and has an Update button that installs the latest GitHub release. The plugin runs with root rights for that (it replaces its own files); its service commands run as your user. A release must carry a zip named `Uber-Watch.zip` with the folder `Uber Watch/` inside.

## More from Ubermoc

Under the update section, **Downloads: more Uber apps for game mode** opens a list: the desktop version of Uber Watch first, then the other Decky Loader plugins (Ubermoc Speech and the Ubermoc Warcraft Mod Updater). Tapping one opens its GitHub page.

## Build the plugin

```bash
npm install && npm run build
```

## Honest status

The panel's status and the no-resume switch were checked against a real system. Pause, Unload and Reload were written to match the tray icon and have not all been exercised from the panel. Tell me what you see.

## License

See `LICENSE`.
