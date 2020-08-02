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
    "commandsOutput": []
}

let center = {
    "name": "center",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsOutput": []
}

let right = {
    "name": "right",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsOutput": []
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
}

function onLeftStatusChanged() {
    if(this.settings.get_value('left-active').deep_unpack()) {
        if (left.box.get_parent()) {
            left.box.get_parent().remove_child(left.box);
        }
        
        left.stopped = false;
        Main.panel._leftBox.insert_child_at_index(left.box, settings.get_value('left-index').deep_unpack());
        this.checkCommands(left, this.settings.get_value('left-commands-json').deep_unpack());
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
        Main.panel._centerBox.insert_child_at_index(center.box, settings.get_value('center-index').deep_unpack());
        this.checkCommands(center, this.settings.get_value('center-commands-json').deep_unpack());
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
        Main.panel._rightBox.insert_child_at_index(right.box, settings.get_value('right-index').deep_unpack());
        this.checkCommands(right, this.settings.get_value('right-commands-json').deep_unpack());
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

    }

    if (location.commandsSettings.commands.length > 0) {

        location.commandsSettings.commands.forEach(function (command, index) {
            if (!executeQueue.some(c => c.command === command.command && c.interval === command.interval
                && c.index === index && c.location === location.name)) {
                command.locationName = location.name;
                command.index = index;
                executeQueue.push(command);
            }
        }, this); 

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

                    /* If you do opt for stderr output, you might as
                     * well use it for more informative errors */
                    if (!proc.get_successful()) {
                        let status = proc.get_exit_status();

                        throw new Gio.IOErrorEnum({
                            code: Gio.io_error_from_errno(status),
                            message: stderr ? stderr.trim() : GLib.strerror(status)
                        });
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

    if (stdout) {
        let entries = [];
        stdout.split('\n').map(line => entries.push(line));
        let outputAsOneLine = '';
        entries.forEach(output => {
            outputAsOneLine = outputAsOneLine + output;
        });

        if (command.locationName === 'left' && !left.stopped) {
            if (!left.commandsSettings.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                left.commandsOutput.splice(index, 1);
            } else {
                left.commandsOutput[command.index] = outputAsOneLine

                GLib.timeout_add_seconds(0, command.interval, () => {
                    if (cancellable && !cancellable.is_cancelled()) {
                        if(command.locationName === 'left' && !left.stopped) {
                                if (!executeQueue.some(c => c.command === command.command && c.interval === command.interval
                                    && c.index === command.index && c.location === command.location)) {
                                    executeQueue.push(command);
                                }
                        }
                    }
    
                    return GLib.SOURCE_REMOVE;
                });
            }
            
            this.setOutput(left);
        } else if (command.locationName === 'center' && !center.stopped) {
            if (!center.commandsSettings.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                center.commandsOutput.splice(index, 1);
            } else {
                center.commandsOutput[command.index] = outputAsOneLine

                GLib.timeout_add_seconds(0, command.interval, () => {
                    if (cancellable && !cancellable.is_cancelled()) {
                        if(command.locationName === 'center' && !center.stopped) {
                                if (!executeQueue.some(c => c.command === command.command && c.interval === command.interval
                                    && c.index === command.index && c.location === command.location)) {
                                    executeQueue.push(command);
                                }
                        }
                    }
    
                    return GLib.SOURCE_REMOVE;
                });
            }
            
            this.setOutput(center);
        } else if (command.locationName === 'right' && !right.stopped) {
            if (!right.commandsSettings.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                right.commandsOutput.splice(index, 1);
            } else {
                right.commandsOutput[command.index] = outputAsOneLine

                GLib.timeout_add_seconds(0, command.interval, () => {
                    if (cancellable && !cancellable.is_cancelled()) {
                        if(command.locationName === 'right' && !right.stopped) {
                                if (!executeQueue.some(c => c.command === command.command && c.interval === command.interval
                                    && c.index === command.index && c.location === command.location)) {
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
}

async function setOutput(location) {
    let string = '';
    location.commandsOutput.forEach(result => {
        string = string + " " + result;
    })
    location.output.set_text(string);
}

