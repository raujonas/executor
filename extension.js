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
    "commandsCopy": {"commands": []},
    "commandsOutput": []
}

let center = {
    "name": "center",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsCopy": {"commands": []},
    "commandsOutput": []
}

let right = {
    "name": "right",
    "output": null,
    "box": null,
    "stopped": null,
    "commandsSettings": {"commands": []},
    "commandsCopy": {"commands": []},
    "commandsOutput": []
}

function init() { 
    //nothing todo here
}

function enable() {
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
    left.commandsCopy = {"commands": []};
    left.commandsOutput = [];
    center.commandsCopy = {"commands": []};
    center.commandsOutput = [];    
    right.commandsCopy = {"commands": []};
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
        left.commandsCopy = {"commands": []}
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
        center.commandsCopy = {"commands": []}
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
        right.commandsCopy = {"commands": []}
        right.commandsOutput = [];
    }
}

function checkCommands(location, json) {
    try {
        location.commandsSettings = JSON.parse(json);
    } catch (e) {

    }

    if (location.commandsSettings.commands.length > 0) {

        location.commandsSettings.commands.forEach(function (command, index) {
            if (!location.commandsCopy.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                location.commandsCopy.commands.splice(index, 0, command);
                this.refresh(location, command, index);
            }
        }, this); 

        location.commandsCopy.commands.forEach(function (command, index) {
            if (!location.commandsSettings.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                location.commandsCopy.commands.splice(index, 1);
                location.commandsOutput.splice(index, 1);
            }
        }, this); 

        this.setOutput(location);

    } else {
        log('No commands specified');
    }
}

async function refresh(location, command, index) {
    await this.updateGui(location, command, index);

    if (location.commandsCopy.commands.some(c => c.command === command.command && c.interval === command.interval)) {
        Mainloop.timeout_add_seconds(command.interval, () => {
            if (!location.stopped) {
                if (location.commandsCopy.commands.some(c => c === command)) {
                    this.refresh(location, command, location.commandsCopy.commands.indexOf(command));
                }
            }    
        });
    }
}

async function updateGui(location, command, index) {
    await execCommand(['/bin/bash', '-c', command.command]).then(async stdout => {
		if (stdout) {
			let entries = [];
		    stdout.split('\n').map(line => entries.push(line));
		    let outputAsOneLine = '';
		    entries.forEach(output => {
		    	outputAsOneLine = outputAsOneLine + output;
            });
            if (!location.stopped) {
                if (!location.commandsCopy.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                    location.commandsOutput.splice(index, 1);
                } else {
                    location.commandsOutput[index] = outputAsOneLine
                }
                
                await this.setOutput(location);
            }    
		}
	});
}

async function setOutput(location) {
    let string = '';
    location.commandsOutput.forEach(result => {
        string = string + " " + result;
    })
    location.output.set_text(string);
}

/*  
    Thanks to Andy again for helping with this:
    https://stackoverflow.com/questions/61147229/multiple-arguments-in-gio-subprocess/61150669#61150669
 */
async function execCommand(argv, input = null, cancellable = null) {
    try {
        let flags = Gio.SubprocessFlags.STDOUT_PIPE;

        if (input !== null)
            flags |= Gio.SubprocessFlags.STDIN_PIPE;

        let proc = new Gio.Subprocess({
            argv: argv,
            flags: flags
        });
        
        proc.init(cancellable);

        let stdout = await new Promise((resolve, reject) => {
            proc.communicate_utf8_async(input, cancellable, (proc, res) => {
                try {
                    let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                    resolve(stdout);
                } catch (e) {
                    reject(e);
                }
            });
        });

        return stdout;
    } catch (e) {
        logError(e);
    }
}
