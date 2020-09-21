![Maintenance](https://img.shields.io/maintenance/yes/2020)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/raujonas/executor)
![GitHub Release Date](https://img.shields.io/github/release-date/raujonas/executor)
![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/raujonas/executor/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/raujonas/executor)

# Executor - Gnome Shell Extension
<img src="resources/icons/icon.png" alt="result" width="50">

Execute arbitrary shell commands periodically and independent from each other with an individual interval and display the output in gnome top bar.

<img src="docs/result.png" alt="result" width="967">

## Install

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" width="220">](https://extensions.gnome.org/extension/2932/executor/)

OR download the <a href="https://github.com/raujonas/executor/releases/latest">zip of the latest release</a> and extract the content to ~/.local/share/gnome-shell/extensions/executor@raujonas.github.io

OR for **latest stable version**: checkout the repo (master branch) to ~/.local/share/gnome-shell/extensions/ and rename the project folder to /executor@raujonas.github.io

## Configuration

The commands and the interval for each command can be set for each location (left, center, right) separately in the settings view.

<img src="docs/settings.png" alt="settings" width="500">

## Debugging

If you have no output or other issues you can usually have a look into the log with 
```console
user@system:~$ journalctl /usr/bin/gnome-shell -f
``` 

## Development

Please feel free to contribute and suggest ideas or report bugs.

Special thanks for testing and your valuable input and ideas to make this extensions even better:\
[@mrsnl](https://github.com/mrsnl) [@peterrus](https://github.com/peterrus)
