const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let output, box, gschema, stopped;
var settings;

let commandsSettings = {
	"commands": []
}

let commandsCopy = {
	"commands": []
}

let commandsOutput = [];

function init() { 
    //nothing todo here
}

function enable() {
    stopped = false;

    gschema = Gio.SettingsSchemaSource.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false
    );

    settings = new Gio.Settings({
        settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
    });

    box = new St.BoxLayout({ style_class: 'panel-button' });
    output = new St.Label();    
    box.add(output, {y_fill: false, y_align: St.Align.MIDDLE});
    Main.panel._rightBox.insert_child_at_index(box, 0);

    this.checkCommands();
}

function disable() {
    stopped = true;
    log("Executor stopped");
    Main.panel._rightBox.remove_child(box);
}

function checkCommands() {
    try {
        commandsSettings = JSON.parse(this.settings.get_value('right-commands-json').deep_unpack());
    } catch (e) {
        Mainloop.timeout_add_seconds(1, () => {
            if (!stopped) {
                this.checkCommands();
            }    
        });
      }

    if (commandsSettings.commands.length > 0) {

        commandsSettings.commands.forEach(function (command, index) {
            if (!commandsCopy.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                commandsCopy.commands.splice(index, 0, command);
                this.refresh(command, index);
            }
        }, this); 

        commandsCopy.commands.forEach(function (command, index) {
            if (!commandsSettings.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                commandsCopy.commands.splice(index, 1);
            }
        }, this); 

    } else {
        log('No commands specified');
    }

    Mainloop.timeout_add_seconds(1, () => {
        if (!stopped) {
            this.checkCommands();
        }    
    });
}

async function refresh(command, index) {
    await this.updateGui(command, index);

    //TODO: Check if command is still in list

    if (commandsCopy.commands.some(c => c.command === command.command && c.interval === command.interval)) {
        Mainloop.timeout_add_seconds(command.interval, () => {
            if (!stopped) {
                if (commandsCopy.commands.some(c => c === command)) {
                    this.refresh(command, commandsCopy.commands.indexOf(command));
                }
            }    
        });
    }
}

async function updateGui(command, index) {
    await execCommand(['/bin/bash', '-c', command.command]).then(stdout => {
		if (stdout) {
			let entries = [];
		    stdout.split('\n').map(line => entries.push(line));
		    let outputAsOneLine = '';
		    entries.forEach(output => {
		    	outputAsOneLine = outputAsOneLine + output + ' ';
            });
            if (!stopped) {
                if (!commandsCopy.commands.some(c => c.command === command.command && c.interval === command.interval)) {
                    commandsOutput.splice(index, 1);
                } else {
                    if (commandsSettings.commands.length > commandsCopy.commands.length) {
                        commandsOutput.splice(commandsCopy.commands.length, commandsSettings.commands.length);
                    }
                    commandsOutput[index] = outputAsOneLine
                }
                
                let string = '';
                commandsOutput.forEach(result => {
                    string = string + " " + result;
                })
                output.set_text(string);
            }    
		}
	});
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
