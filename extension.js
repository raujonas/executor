import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const POSITIONS = {
    0: 'left',
    1: 'center',
    2: 'right',
};

export default class Executor extends Extension {
    enable() {
        console.log('Executor enabled');

        if (!this.cancellable) {
            this.cancellable = new Gio.Cancellable();
        }

        this.timeoutSourceIds = []
        this.stopped = false;
        this.settings = this.getSettings();
        this.executeQueue = [];
        this.locations = {};

        for (let position = 0; position < 3; position++) {
            this.locations[position] = {
                name: POSITIONS[position],
                output: [],
                box: null,
                container: null,
                stopped: null,
                commandsSettings: {commands: []},
                commandsOutput: [],
                lastIndex: null,
                activeChanged: null,
                indexChanged: null,
                commandsJsonChanged: null,
                locationClicked: null,
            };

            this.locations[position].stopped = false;

            this.locations[position].box = new PanelMenu.Button(0.0, 'Executor Extension', true);
            this.locations[position].box.setSensitive(true);
            this.locations[position].container = this.locations[position].box.container;

            this.locations[position].locationClicked = this.locations[position].box.connect(
                'button-press-event',
                () => {
                    if (this.settings.get_value('click-on-output-active').deep_unpack()) {
                        this.settings.set_int('location', position);
                        this.timeoutSourceIds.push(
                            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                                this.openPreferences();
                            })
                        );
                    }
                }
            );

            if (this.locations[position].container.get_parent()) {
                this.locations[position].container.get_parent().remove_child(this.locations[position].container);
            }

            this.onStatusChanged(this.locations[position]);

            this.locations[position].activeChanged = this.settings.connect(
                'changed::' + POSITIONS[position] + '-active',
                () => {
                    this.onStatusChanged(this.locations[position]);
                }
            );

            this.locations[position].indexChanged = this.settings.connect(
                'changed::' + POSITIONS[position] + '-index',
                () => {
                    this.onStatusChanged(this.locations[position]);
                }
            );

            this.locations[position].commandsJsonChanged = this.settings.connect(
                'changed::' + POSITIONS[position] + '-commands-json',
                () => {
                    this.onStatusChanged(this.locations[position]);
                }
            );
        }

        this.checkQueue();
    }

    disable() {
        this.stopped = true;

        for (let position = 0; position < 3; position++) {
            this.locations[position].stopped = true;

            if (this.locations[position].container.get_parent()) {
                this.locations[position].container.get_parent().remove_child(this.locations[position].container);
            }

            this.locations[position].box.disconnect(this.locations[position].locationClicked);

            this.locations[position].box.remove_all_children();
            this.locations[position].box = null;

            this.locations[position].commandsOutput = [];
            this.locations[position].output = [];

            this.settings.disconnect(this.locations[position].activeChanged);
            this.settings.disconnect(this.locations[position].indexChanged);
            this.settings.disconnect(this.locations[position].commandsJsonChanged);
        }

        this.settings = null;
        this.executeQueue = null;
        this.locations = null;

        if (this.timeoutSourceIds.length > 0) {
            this.timeoutSourceIds.forEach((sourceId) => {
                GLib.Source.remove(sourceId);
                sourceId = null;
            });
        }

        console.log('Executor stopped');
    }

    initOutputLabels(location) {
        location.box.remove_all_children();
        location.commandsSettings.commands.forEach(function (command, index) {
            location.output[index] = new St.Label({y_expand: true, y_align: 2});
            location.box.add_child(location.output[index]);
        }, this);
    }

    onStatusChanged(location) {
        if (this.settings.get_value(location.name + '-active').deep_unpack()) {
            if (location.container.get_parent()) {
                location.container.get_parent().remove_child(location.container);
            }

            location.stopped = false;
            if (location.lastIndex === null) {
                this.checkCommands(location, this.settings.get_value(location.name + '-commands-json').deep_unpack());
                location.lastIndex = this.settings.get_value(location.name + '-index').deep_unpack();
            } else if (this.settings.get_value(location.name + '-index').deep_unpack() !== location.lastIndex) {
                location.lastIndex = this.settings.get_value(location.name + '-index').deep_unpack();
            } else {
                this.checkCommands(location, this.settings.get_value(location.name + '-commands-json').deep_unpack());
            }

            Main.panel['_' + location.name + 'Box'].insert_child_at_index(location.container, location.lastIndex);
        } else {
            location.stopped = true;
            if (location.container.get_parent()) {
                location.container.get_parent().remove_child(location.container);
            }
            this.removeOldCommands(location);
            location.commandsOutput = [];
            location.output = [];
            location.box.remove_all_children();
        }
    }

    removeOldCommands(location) {
        this.executeQueue.forEach(function (command, index) {
            if (command.locationName === location.name) {
                this.executeQueue.splice(index, 1);
            }
        }, this);
    }

    checkCommands(location, json) {
        try {
            location.commandsSettings = JSON.parse(json);
        } catch (e) {
            console.log('Error in json file for location: ' + location.name);
        }

        this.initOutputLabels(location);

        if (location.commandsSettings.commands.length > 0) {
            location.commandsSettings.commands.forEach(function (command, index) {
                if (command.isActive || command.isActive == null) {
                    if (!this.executeQueue.some((c) => c.uuid === command.uuid)) {
                        command.locationName = location.name;
                        command.index = index;
                        this.executeQueue.push(command);
                    }
                }
            }, this);

            //if (location.commandsSettings.commands.length < location.commandsOutput.length) {
            location.commandsOutput = [];
            //}

            this.resetOutput(location);
        } else {
            console.log('No commands specified: ' + location.name);
            location.commandsOutput = [];
            this.resetOutput(location);
        }
    }

    checkQueue() {
        if (!this.stopped && this.executeQueue.length > 0) {
            let copy = this.executeQueue;
            this.executeQueue = [];
            this.handleCurrentQueue(copy);
        } else {
            this.timeoutSourceIds.push(
                GLib.timeout_add(0, 500, () => {
                    this.checkQueue();
                    return GLib.SOURCE_REMOVE;
                })
            );
        }
    }

    handleCurrentQueue(copy) {
        let current = copy.shift();

        this.execCommand(current, ['bash', '-c', current.command]);

        if (copy.length > 0) {
            this.timeoutSourceIds.push(
                GLib.timeout_add(0, 50, () => {
                    if (copy.length > 0) {
                        this.handleCurrentQueue(copy);
                    }
                    return GLib.SOURCE_REMOVE;
                })
            );
        } else if (!this.stopped) {
            this.checkQueue();
        }
    }

    async execCommand(command, argv, input = null, cancellable = null) {
        try {
            let flags = Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE;

            if (input !== null) flags |= Gio.SubprocessFlags.STDIN_PIPE;

            let proc = Gio.Subprocess.new(argv, flags);

            return new Promise((resolve, reject) => {
                proc.communicate_utf8_async(input, cancellable, (proc, res) => {
                    try {
                        let [, stdout, stderr] = proc.communicate_utf8_finish(res);

                        if (!proc.get_successful()) {
                            let status = proc.get_exit_status();

                            console.log(
                                'Executor: error in command "' +
                                    command.command +
                                    '": ' +
                                    (stderr ? stderr.trim() : GLib.strerror(status))
                            );

                            /*throw new Gio.IOErrorEnum({
                                code: Gio.io_error_from_errno(status),
                                message: stderr ? stderr.trim() : GLib.strerror(status)
                            });*/
                        }

                        this.callback(command, stdout);
                        resolve(stdout);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    callback(command, stdout) {
        let entries = [];
        let outputAsOneLine = '';

        if (stdout) {
            stdout.split('\n').map((line) => entries.push(line));
            entries.forEach((output) => {
                outputAsOneLine = outputAsOneLine + output;
            });
        } else {
            outputAsOneLine = '';
        }

        let locationIndex = Object.keys(POSITIONS).find((key) => POSITIONS[key] === command.locationName);

        if (!this.stopped && !this.locations[locationIndex].stopped) {
            if (!this.locations[locationIndex].commandsSettings.commands.some((c) => c.uuid === command.uuid)) {
                this.locations[locationIndex].commandsOutput.splice(index, 1);
            } else {
                this.locations[locationIndex].commandsOutput[command.index] = outputAsOneLine;

                if (
                    this.locations[locationIndex].commandsSettings.commands.length <
                    this.locations[locationIndex].commandsOutput.length
                ) {
                    this.locations[locationIndex].commandsOutput = [];
                }

                this.timeoutSourceIds.push(
                    GLib.timeout_add_seconds(0, command.interval, () => {
                        if (this.cancellable && !this.cancellable.is_cancelled()) {
                            if (!this.stopped && !this.locations[locationIndex].stopped) {
                                if (!this.executeQueue.some((c) => c.uuid === command.uuid)) {
                                    this.executeQueue.push(command);
                                }
                            }
                        }

                        return GLib.SOURCE_REMOVE;
                    })
                );
            }
            try {
                this.setOutput(this.locations[locationIndex], command.index);
            } catch (e) {
                console.log('Caught exception while setting output: ' + e);
            }
        }
    }

    resetOutput(location) {
        location.output.forEach((output) => {
            output.set_text('');
        });
    }

    async setOutput(location, index) {
        let executorRegex = new RegExp(/(<executor\..*?\..*?>)/g);
        let executorSettingsArray = location.commandsOutput[index].match(executorRegex);
        let markupSet = false;

        location.output[index].set_style_class_name('');

        if (executorSettingsArray != null) {
            executorSettingsArray.forEach((setting) => {
                location.commandsOutput[index] = location.commandsOutput[index].replace(setting, '');

                let settingDivided = setting.substring(1, setting.length - 1).split('.');

                if (settingDivided[1] == 'css') {
                    location.output[index].add_style_class_name(settingDivided[2]);
                } else if (settingDivided[1] == 'markup') {
                    markupSet = true;
                }
            });
        }

        if (markupSet) {
            location.output[index].get_clutter_text().set_markup(location.commandsOutput[index]);
        } else {
            location.output[index].set_text(location.commandsOutput[index]);
        }
    }
}
