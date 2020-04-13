const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let output, box, gschema, stopped;
var settings;

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

    this.refresh();
}

function disable() {
    stopped = true;
    log("Executor stopped");
    Main.panel._rightBox.remove_child(box);
}

async function refresh() {
    await this.updateGui();
    
	Mainloop.timeout_add_seconds(this.settings.get_value('interval').deep_unpack(), () => {
        if (!stopped) {
            this.refresh();
        }    
    });
}

async function updateGui() {
    await execCommand(['/bin/bash', '-c', this.settings.get_value('command').deep_unpack()]).then(stdout => {
		if (stdout) {
			let entries = [];
		    stdout.split('\n').map(line => entries.push(line));
		    let outputAsOneLine = '';
		    entries.forEach(output => {
		    	outputAsOneLine = outputAsOneLine + output + ' ';
            });
            if (!stopped) {
                log(outputAsOneLine);
		        output.set_text(outputAsOneLine);
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
