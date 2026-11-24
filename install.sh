#!/usr/bin/env bash
# Installs the plugin into Decky Loader (needs sudo: the plugins folder belongs to root). Run from this folder.
set -e
dest="$HOME/homebrew/plugins/Ubermoc Watchdog"
sudo rm -rf "$dest"
sudo mkdir -p "$dest"
sudo cp -r plugin.json package.json main.py LICENSE dist "$dest/"
sudo systemctl restart plugin_loader
echo "Installed. Open the Quick Access menu in game mode, then the plug icon."
