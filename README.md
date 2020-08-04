# Executor - Gnome Shell Extension
Executes arbitrary shell commands periodically and displays the result in gnome status bar. 

<img src="https://raw.githubusercontent.com/raujonas/executor/master/docs/result.png" alt="result" width="200">

## Install

Get it here: <a href="https://extensions.gnome.org/extension/2932/executor/">https://extensions.gnome.org/extension/2932/executor/</a> 

OR download the <a href="https://github.com/raujonas/executor/releases/download/v1/executor@raujonas.github.io">zip of the latest release</a> and extract the content to ~/.local/share/gnome-shell/extensions/executor@raujonas.github.io

OR checkout this repo to ~/.local/share/gnome-shell/extensions/ and rename the project folder to /executor@raujonas.github.io

## Configuration

The commands and the index of the result string in the top bar could be set for each location (left, center, right) separately in the settings view.

<img src="https://raw.githubusercontent.com/raujonas/executor/master/docs/settings.png" alt="settings" width="500">

### Basic example

The commands and the interval for each command are currently set via a simple json file:


```json
{"commands":[
    {"command":"echo Executor works!","interval":1}
]}
```
The interval is set in seconds.

### Advanced example

NOTE: if quotation marks are used inside a command they have to be escaped: awk '{printf (\\"%.2f\\", $3/1000)}'

```json
{"commands":[
    {"command":"top -b -i -n1 | grep -i 'cpu(s)' | head -c13 | awk '{print $2}' | tr ',' '.' && echo -n '% |'","interval":1},
    {"command":"lscpu | grep 'MHz' | awk '{printf (\"%.2f\", $3/1000)}' && echo 'Ghz |'","interval":2},
    {"command":"free | grep 'Speicher' | head -c33 | awk '{printf (\"%.2f\", $3/1024/1024)}' && echo 'GB |'","interval":2},
    {"command":"free | grep 'Auslager' | head -c33 | awk '{printf (\"%.2f\", $3/1024/1024)}' && echo 'GB |'","interval":5},
    {"command":"uptime | sed 's/^.\\+up\\ \\+\\([^,]*\\).*/\\1/g'","interval":60}
]}
```
