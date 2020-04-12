const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;

let text, button, output, box;

let COMMAND = 'echo "Executor works!"';

/* Example for using other commands: 
In this case, psuinfo needs to be installed first.

let COMMAND = 'echo -n "psuinfo: " && psuinfo -Castmwu -S"|"';
*/

let INTERVAL = 3;

function init() {
	box = new St.BoxLayout({ style_class: 'panel-button' });
    output = new St.Label();    
    box.add(output, {y_fill: false, y_align: St.Align.MIDDLE});
    
    this.start();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(box, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}

function start() {
    this.update();
    
    Mainloop.timeout_add_seconds(INTERVAL, () => {
            this.update();
            return GLib.SOURCE_CONTINUE;
        });
}

function update() {
	execCommand(['/bin/sh', '-c', COMMAND]).then(stdout => {
		if (stdout) {
			let entries = [];
		    stdout.split('\n').map(line => entries.push(line));
		    let outputAsOneLine = '';
		    entries.forEach(output => {
		    	outputAsOneLine = outputAsOneLine + output + ' ';
		    });
		    log(outputAsOneLine);
		    output.set_text(outputAsOneLine);
		}
	});
}

/* https://wiki.gnome.org/AndyHolmes/Sandbox/SpawningProcesses */
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
