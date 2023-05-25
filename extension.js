const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;
const ExtManager = Main.extensionManager;

let gschema;
var settings;

var locations = {};

let cancellable = null;
let executeQueue = [];
let resultEvent;

const POSITIONS = {
    0: 'left',
    1: 'center',
    2: 'right'
};

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function enable() {
    if (cancellable === null) {
        cancellable = new Gio.Cancellable()
    }

    log('Executor enabled');

    gschema = Gio.SettingsSchemaSource.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false
    );

    settings = new Gio.Settings({
        settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
    });

    for (let position = 0; position < 3; position++) {
        this.locations[position] = {
            "name": POSITIONS[position],
            "output": [],
            "box": null,
            "stopped": null,
            "commandsSettings": { "commands": [] },
            "commandsOutput": [],
            "lastIndex": null,
            "activeChanged": null,
            "indexChanged": null,
            "commandsJsonChanged": null,
            "locationClicked": null
        }

        this.locations[position].stopped = false;

        this.locations[position].box = new St.BoxLayout({ style_class: 'panel-button', reactive: true });

        this.locations[position].locationClicked = this.locations[position].box.connect(
            'button-press-event', () => {
                if (this.settings.get_value('click-on-output-active').deep_unpack()) {
                    this.settings.set_int('location', position);
                    GLib.timeout_add(
                        GLib.PRIORITY_DEFAULT,
                        100,
                        () => {
                            ExtManager.openExtensionPrefs(Me.metadata.uuid, '', {});
                        });
                }
            }
        );

        if (this.locations[position].box.get_parent()) {
            this.locations[position].box.get_parent().remove_child(this.locations[position].box);
        }

        this.onStatusChanged(this.locations[position]);

        this.locations[position].activeChanged = this.settings.connect(
            'changed::' + POSITIONS[position] + '-active', () => {
                this.onStatusChanged(this.locations[position])
            }
        );

        this.locations[position].indexChanged = this.settings.connect(
            'changed::' + POSITIONS[position] + '-index', () => {
                this.onStatusChanged(this.locations[position])
            }
        );

        this.locations[position].commandsJsonChanged = this.settings.connect(
            'changed::' + POSITIONS[position] + '-commands-json', () => {
                this.onStatusChanged(this.locations[position])
            }
        );
    }

    this.checkQueue();
}

function disable() {
    for (let position = 0; position < 3; position++) {
        this.locations[position].stopped = true;

        if (this.locations[position].box.get_parent()) {
            this.locations[position].box.get_parent().remove_child(this.locations[position].box);
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
    settings = null;

    log("Executor stopped");
}

function initOutputLabels(location) {
    location.box.remove_all_children();
    location.commandsSettings.commands.forEach(function (command, index) {
        location.output[index] = new St.Label({ y_expand: true, y_align: 2 });
        location.box.add_child(location.output[index]);
    }, this);

}

function onStatusChanged(location) {
    if (this.settings.get_value(location.name + '-active').deep_unpack()) {
        if (location.box.get_parent()) {
            location.box.get_parent().remove_child(location.box);
        }

        location.stopped = false;
        if (location.lastIndex === null) {
            this.checkCommands(location, this.settings.get_value(location.name + '-commands-json').deep_unpack());
            location.lastIndex = settings.get_value(location.name + '-index').deep_unpack();
        } else if (settings.get_value(location.name + '-index').deep_unpack() !== location.lastIndex) {
            location.lastIndex = settings.get_value(location.name + '-index').deep_unpack();
        } else {
            this.checkCommands(location, this.settings.get_value(location.name + '-commands-json').deep_unpack());
        }

        Main.panel['_' + location.name + 'Box'].insert_child_at_index(location.box, location.lastIndex);

    } else {
        location.stopped = true;
        if (location.box.get_parent()) {
            location.box.get_parent().remove_child(location.box);
        }
        this.removeOldCommands(location);
        location.commandsOutput = [];
        location.output = [];
        location.box.remove_all_children();
    }
}

function removeOldCommands(location) {
    executeQueue.forEach(function (command, index) {
        if (command.locationName === location.name) {
            executeQueue.splice(index, 1);
        }
    }, this);
}

function checkCommands(location, json) {
    try {
        location.commandsSettings = JSON.parse(json);
    } catch (e) {
        log('Error in json file for location: ' + location.name);
    }

    this.initOutputLabels(location);

    if (location.commandsSettings.commands.length > 0) {

        location.commandsSettings.commands.forEach(function (command, index) {
            if (command.isActive || command.isActive == null) {
                if (!executeQueue.some(c => c.uuid === command.uuid)) {
                    command.locationName = location.name;
                    command.index = index;
                    executeQueue.push(command);
                }
            }
        }, this);

        //if (location.commandsSettings.commands.length < location.commandsOutput.length) {
        location.commandsOutput = [];
        //}

        this.resetOutput(location);

    } else {
        log('No commands specified: ' + location.name);
        location.commandsOutput = [];
        this.resetOutput(location);
    }
}

function checkQueue() {
    if (executeQueue.length > 0) {
        let copy = executeQueue;
        executeQueue = [];
        this.handleCurrentQueue(copy);
    } else {
        GLib.timeout_add(0, 500, () => {
            this.checkQueue()
            return GLib.SOURCE_REMOVE;
        });
    }
}

function handleCurrentQueue(copy) {
    let current = copy.shift();

    this.execCommand(current, ['bash', '-c', current.command]);

    if (copy.length > 0) {
        GLib.timeout_add(0, 50, () => {
            if (copy.length > 0) {
                this.handleCurrentQueue(copy)
            }
            return GLib.SOURCE_REMOVE;
        });
    } else {
        this.checkQueue();
    }
}

async function execCommand(command, argv, input = null, cancellable = null) {
    try {
        let flags = (Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_PIPE);

        if (input !== null)
            flags |= Gio.SubprocessFlags.STDIN_PIPE;

        let proc = Gio.Subprocess.new(argv, flags);

        return new Promise((resolve, reject) => {
            proc.communicate_utf8_async(input, cancellable, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);

                    if (!proc.get_successful()) {
                        let status = proc.get_exit_status();

                        log('Executor: error in command "' + command.command + '": ' + (stderr ? stderr.trim() : GLib.strerror(status)));

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

function callback(command, stdout) {

    let entries = [];
    let outputAsOneLine = '';

    if (stdout) {
        stdout.split('\n').map(line => entries.push(line));
        entries.forEach(output => {
            outputAsOneLine = outputAsOneLine + output;
        });
    } else {
        outputAsOneLine = '';
    }

    let locationIndex = Object.keys(POSITIONS).find(key => POSITIONS[key] === command.locationName)

    if (!this.locations[locationIndex].stopped) {
        if (!this.locations[locationIndex].commandsSettings.commands.some(c => c.uuid === command.uuid)) {
            this.locations[locationIndex].commandsOutput.splice(index, 1);
        } else {
            this.locations[locationIndex].commandsOutput[command.index] = outputAsOneLine

            if (this.locations[locationIndex].commandsSettings.commands.length < this.locations[locationIndex].commandsOutput.length) {
                this.locations[locationIndex].commandsOutput = [];
            }

            GLib.timeout_add_seconds(0, command.interval, () => {
                if (cancellable && !cancellable.is_cancelled()) {
                    if (!this.locations[locationIndex].stopped) {
                        if (!executeQueue.some(c => c.uuid === command.uuid)) {
                            executeQueue.push(command);
                        }
                    }
                }

                return GLib.SOURCE_REMOVE;
            });
        }
        try {
            this.setOutput(this.locations[locationIndex], command.index);
        } catch (e) {
            log('Caught exception while setting output: ' + e);
        }
    }
}

function resetOutput(location) {
    location.output.forEach(output => {
        output.set_text('');
    })
}

async function setOutput(location, index) {
    let executorRegex = new RegExp(/(<executor\..*?\..*?>)/g);
    let executorSettingsArray = location.commandsOutput[index].match(executorRegex);
    let markupSet = false;

    location.output[index].set_style_class_name("");

    if (executorSettingsArray != null) {
        executorSettingsArray.forEach(setting => {
            location.commandsOutput[index] = location.commandsOutput[index].replace(setting, "");

            let settingDivided = setting.substring(1, setting.length - 1).split(".");
    
            if (settingDivided[1] == "css") {
                location.output[index].add_style_class_name(settingDivided[2])
            } else if (settingDivided[1] == "markup") {
                markupSet = true
            }
        })
    }    

    if (markupSet) {
        location.output[index].get_clutter_text().set_markup(location.commandsOutput[index]);
    } else {
        location.output[index].set_text(location.commandsOutput[index]);
    }
}
