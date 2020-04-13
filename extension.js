const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let gschema;
var settings;

let leftActiveChanged, leftIndexChanged, leftCommandsJsonChanged;
let centerActiveChanged, centerIndexChanged, centerCommandsJsonChanged;
let rightActiveChanged, rightIndexChanged, rightCommandsJsonChanged;

let left = {
    "name": "left",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsOutput": [],
    "lastIndex": null
}

let center = {
    "name": "center",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsOutput": [],
    "lastIndex": null
}

let right = {
    "name": "right",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsOutput": [],
    "lastIndex": null
}

let cancellable = null;
let executeQueue = [];
let resultEvent;

function init() { 
    //nothing todo here
}

function enable() {
    if (cancellable === null) {
        cancellable = new Gio.Cancellable()
    }

    log('Executor enabled');

    left.stopped = false;
    center.stopped = false;
    right.stopped = false;

    gschema = Gio.SettingsSchemaSource.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false
    );

    settings = new Gio.Settings({
        settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
    });

    left.box = new St.BoxLayout({ style_class: 'panel-button' });
    if (left.box.get_parent()) {
        left.box.get_parent().remove_child(left.box);
    }
    left.output = new St.Label();
    left.box.add(left.output, {y_fill: false, y_align: St.Align.MIDDLE});
    this.onLeftStatusChanged();

    center.box = new St.BoxLayout({ style_class: 'panel-button' });
    if (center.box.get_parent()) {
        center.box.get_parent().remove_child(center.box);
    }
    center.output = new St.Label();
    center.box.add(center.output, {y_fill: false, y_align: St.Align.MIDDLE});
    this.onCenterStatusChanged();

    right.box = new St.BoxLayout({ style_class: 'panel-button' });
    if (right.box.get_parent()) {
        right.box.get_parent().remove_child(right.box);
    }
    right.output = new St.Label();
    right.box.add(right.output, {y_fill: false, y_align: St.Align.MIDDLE});
    this.onRightStatusChanged();

    leftActiveChanged = this.settings.connect(
		'changed::left-active',
		this.onLeftStatusChanged.bind(this)
    );
    
    leftIndexChanged = this.settings.connect(
		'changed::left-index',
		this.onLeftStatusChanged.bind(this)
    );

    leftCommandsJsonChanged = this.settings.connect(
		'changed::left-commands-json',
		this.onLeftStatusChanged.bind(this)
    );
    
    centerActiveChanged = this.settings.connect(
		'changed::center-active',
		this.onCenterStatusChanged.bind(this)
    );
    
    centerIndexChanged = this.settings.connect(
		'changed::center-index',
		this.onCenterStatusChanged.bind(this)
    );
    
    centerCommandsJsonChanged = this.settings.connect(
		'changed::center-commands-json',
		this.onCenterStatusChanged.bind(this)
    );

    rightActiveChanged = this.settings.connect(
		'changed::right-active',
		this.onRightStatusChanged.bind(this)
    );
    
    rightIndexChanged = this.settings.connect(
		'changed::right-index',
		this.onRightStatusChanged.bind(this)
    );
    
    rightCommandsJsonChanged = this.settings.connect(
		'changed::right-commands-json',
		this.onRightStatusChanged.bind(this)
    );

    this.checkQueue();
}

function disable() {
    left.stopped = true;
    center.stopped = true;
    right.stopped = true;
    log("Executor stopped");
    if (left.box.get_parent()) {
        left.box.get_parent().remove_child(left.box);
    }
    if (center.box.get_parent()) {
        center.box.get_parent().remove_child(center.box);
    }
    if (right.box.get_parent()) {
        right.box.get_parent().remove_child(right.box);
    }
    left.box = null;
    center.box = null;
    right.box = null;
    left.commandsOutput = [];
    center.commandsOutput = [];    
    right.commandsOutput = [];

    this.settings.disconnect(leftActiveChanged);
    this.settings.disconnect(leftIndexChanged);
    this.settings.disconnect(leftCommandsJsonChanged);
    this.settings.disconnect(centerActiveChanged);
    this.settings.disconnect(centerIndexChanged);
    this.settings.disconnect(centerCommandsJsonChanged);
    this.settings.disconnect(rightActiveChanged);
    this.settings.disconnect(rightIndexChanged);
    this.settings.disconnect(rightCommandsJsonChanged);
}

function onLeftStatusChanged() {
    if(this.settings.get_value('left-active').deep_unpack()) {
        if (left.box.get_parent()) {
            left.box.get_parent().remove_child(left.box);
        }
        
        left.stopped = false;
        if (left.lastIndex === null) {
            this.checkCommands(left, this.settings.get_value('left-commands-json').deep_unpack()); 
            left.lastIndex = settings.get_value('left-index').deep_unpack();
        } else if (settings.get_value('left-index').deep_unpack() !== left.lastIndex) {
            left.lastIndex = settings.get_value('left-index').deep_unpack();
        }  else {
            this.checkCommands(left, this.settings.get_value('left-commands-json').deep_unpack()); 
        }
        Main.panel._leftBox.insert_child_at_index(left.box, left.lastIndex);
    } else {
        left.stopped = true;
        if (left.box.get_parent()) {
            left.box.get_parent().remove_child(left.box);
        }        
        this.removeOldCommands(left);
        left.commandsOutput = [];
    }
}

function onCenterStatusChanged() {
    if(this.settings.get_value('center-active').deep_unpack()) {
        if (center.box.get_parent()) {
            center.box.get_parent().remove_child(center.box);
        }

        center.stopped = false;
        if (center.lastIndex === null) {
            this.checkCommands(center, this.settings.get_value('center-commands-json').deep_unpack()); 
            center.lastIndex = settings.get_value('center-index').deep_unpack();
        } else if (settings.get_value('center-index').deep_unpack() !== center.lastIndex) {
            center.lastIndex = settings.get_value('center-index').deep_unpack();
        }  else {
            this.checkCommands(center, this.settings.get_value('center-commands-json').deep_unpack()); 
        }
        Main.panel._centerBox.insert_child_at_index(center.box, settings.get_value('center-index').deep_unpack());
    } else {
        center.stopped = true;
        if (center.box.get_parent()) {
            center.box.get_parent().remove_child(center.box);
        }
        this.removeOldCommands(center);
        center.commandsOutput = [];
    }
}

function onRightStatusChanged() {
    if(this.settings.get_value('right-active').deep_unpack()) {
        if (right.box.get_parent()) {
            right.box.get_parent().remove_child(right.box);
        }

        right.stopped = false;
        if (right.lastIndex === null) {
            this.checkCommands(right, this.settings.get_value('right-commands-json').deep_unpack()); 
            right.lastIndex = settings.get_value('right-index').deep_unpack();
        } else if (settings.get_value('right-index').deep_unpack() !== right.lastIndex) {
            right.lastIndex = settings.get_value('right-index').deep_unpack();
        }  else {
            this.checkCommands(right, this.settings.get_value('right-commands-json').deep_unpack()); 
        }
        Main.panel._rightBox.insert_child_at_index(right.box, settings.get_value('right-index').deep_unpack());
    } else {
        right.stopped = true;
        if (right.box.get_parent()) {
            right.box.get_parent().remove_child(right.box);
        }
        this.removeOldCommands(right);
        right.commandsOutput = [];
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

    if (location.commandsSettings.commands.length > 0) {

        location.commandsSettings.commands.forEach(function (command, index) {
            if (!executeQueue.some(c => c.uuid === command.uuid)) {
                command.locationName = location.name;
                command.index = index;
                executeQueue.push(command);
            }
        }, this); 

        //if (location.commandsSettings.commands.length < location.commandsOutput.length) {
            location.commandsOutput = [];
        //}

        this.setOutput(location);

    } else {
        log('No commands specified');
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

    this.execCommand(current, ['/bin/bash', '-c', current.command]);

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

        let proc = Gio.Subprocess.new(argv,flags);
        
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

    if (command.locationName === 'left' && !left.stopped) {
        if (!left.commandsSettings.commands.some(c => c.uuid === command.uuid)) {
            left.commandsOutput.splice(index, 1);
        } else {
            left.commandsOutput[command.index] = outputAsOneLine
            
            if (left.commandsSettings.commands.length < left.commandsOutput.length) {
                left.commandsOutput = [];
            }

            GLib.timeout_add_seconds(0, command.interval, () => {
                if (cancellable && !cancellable.is_cancelled()) {
                    if(command.locationName === 'left' && !left.stopped) {
                        if (!executeQueue.some(c => c.uuid === command.uuid)) {
                            executeQueue.push(command);
                        }
                    }
                }

                return GLib.SOURCE_REMOVE;
            });
        }
        
        this.setOutput(left);
    } else if (command.locationName === 'center' && !center.stopped) {
        if (!center.commandsSettings.commands.some(c => c.uuid === command.uuid)) {
            center.commandsOutput.splice(index, 1);
        } else {
            center.commandsOutput[command.index] = outputAsOneLine

            if (center.commandsSettings.commands.length < center.commandsOutput.length) {
                center.commandsOutput = [];
            }

            GLib.timeout_add_seconds(0, command.interval, () => {
                if (cancellable && !cancellable.is_cancelled()) {
                    if(command.locationName === 'center' && !center.stopped) {
                        if (!executeQueue.some(c => c.uuid === command.uuid)) {
                            executeQueue.push(command);
                        }
                    }
                }

                return GLib.SOURCE_REMOVE;
            });
        }
        
        this.setOutput(center);
    } else if (command.locationName === 'right' && !right.stopped) {
        if (!right.commandsSettings.commands.some(c => c.uuid === command.uuid)) {
            right.commandsOutput.splice(index, 1);
        } else {
            right.commandsOutput[command.index] = outputAsOneLine

            if (right.commandsSettings.commands.length < right.commandsOutput.length) {
                right.commandsOutput = [];
            }

            GLib.timeout_add_seconds(0, command.interval, () => {
                if (cancellable && !cancellable.is_cancelled()) {
                    if(command.locationName === 'right' && !right.stopped) {
                        if (!executeQueue.some(c => c.uuid === command.uuid)) {
                            executeQueue.push(command);
                        }
                    }
                }

                return GLib.SOURCE_REMOVE;
            });
        }
        
        this.setOutput(right);
    }
}

async function setOutput(location) {
    let string = '';
    location.commandsOutput.forEach(result => {
        string = string + " " + result;
    })
    location.output.set_text(string);
}

