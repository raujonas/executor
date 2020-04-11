const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;

let text, button, output, box;

let COMMAND = 'echo -n "psuinfo: " && psuinfo -Castmu -S"|"';
let INTERVAL = 3;

function init() {
	box = new St.BoxLayout({ style_class: 'panel-button' });
    output = new St.Label();    
    box.add(output, {y_fill: false, y_align: St.Align.MIDDLE});
                                     
    this.executeCommand();
    
    Mainloop.timeout_add_seconds(INTERVAL, () => {
            this.executeCommand();
            return GLib.SOURCE_CONTINUE;
        });
        
    /*box = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
                         
    output = new St.Label(); 
    output.set_text("asdf");
    box.set_child(output);   */
}

function executeCommand() {
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
	
	/*let entries = [];
	let stdout = GLib.spawn_command_line_sync("psuinfo -Castmu -S|")[1].toString());
	stdout.split('\n').map(line => entries.push(line));
    log(entries[0]);
	output.set_text(entries[0]);
    return true;*/
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(box, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}

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
