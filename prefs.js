'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let leftCommandsArray = [{"command":"sh ~/script.sh","interval":2}, {"command":"echo 'Executor works'","interval":1}]
let leftListBox = new Gtk.ListBox({
    visible: true
});

function init() {
}

function buildPrefsWidget() {

    let gschema = Gio.SettingsSchemaSource.new_from_directory(
        Me.dir.get_child('schemas').get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false
    );

    let settings = new Gio.Settings({
        settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
    });

    let notebook = new Gtk.Notebook({
        visible: true
    });
    
    let prefsWidget = new Gtk.Grid({
        /*margin: 18,
        column_spacing: 12,
        row_spacing: 12,*/
        visible: true,
        column_homogeneous: true,
    });

    prefsWidget.attach(notebook, 0, 0, 1, 1);

    /* LEFT */
    let leftGrid = new Gtk.Grid({
        /*margin: 18,*/
        column_spacing: 12,
        row_spacing: 12,
        visible: true,
        column_homogeneous: true,
        vexpand: true,
        hexpand: true
    });

    let leftTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    leftGrid.attach(leftTopHbox, 0, 0, 2, 1);
    let leftLabel = new Gtk.Label({
        label: 'Active:',
        use_markup: true,
        visible: true
    });
    let leftActive = new Gtk.Switch({
        visible: true,
        halign: Gtk.Align.CENTER,
    });

    let leftIndexLabel = new Gtk.Label({
        label: 'Index:',
        visible: true,
        halign: Gtk.Align.END,
    });
    let leftIndex = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 10,
            step_increment: 1
        }),
        visible: true
    });
    leftIndex.set_size_request(125,0);
    leftTopHbox.pack_start(leftLabel,false,true, 0);
    leftTopHbox.pack_start(leftActive,false,true, 0);
    leftTopHbox.pack_start(leftIndexLabel,true,true, 0);
    leftTopHbox.pack_start(leftIndex,false,true, 0);

    let leftSeparator = new Gtk.Separator({
        visible: true,
        orientation: Gtk.Orientation.VERTICAL
    })
    leftGrid.attach(leftSeparator, 0, 2, 2, 1);

    leftGrid.attach(this.leftListBox, 0, 3, 2, 1);
    this.populateLeftCommands();

    let leftButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let leftAddButton = new Gtk.Button({visible: true, label: 'Add'});
    leftAddButton.connect ("clicked", this.leftAddButtonClicked.bind(this));
    let leftRemoveButton = new Gtk.Button({visible: true, label: 'Remove'});
    let leftSaveButton = new Gtk.Button({visible: true, label: 'Save'});
    leftButtonsHbox.pack_start(leftAddButton,false,true, 0);
    leftButtonsHbox.pack_start(leftRemoveButton,false,true, 0);
    leftButtonsHbox.pack_end(leftSaveButton,false,true, 0);
    leftGrid.attach(leftButtonsHbox, 0, 4, 2, 1);
    
    let pageLeft = new Gtk.Box({
        visible: true
    });
    pageLeft.border_width = 10;
    pageLeft.add(leftGrid);
    notebook.append_page(pageLeft,new Gtk.Label({label: "Left", visible: true}));

    /* CENTER */
    let centerGrid = new Gtk.Grid({
        /*margin: 18,*/
        column_spacing: 12,
        row_spacing: 12,
        visible: true,
        column_homogeneous: true,
        vexpand: true,
        hexpand: true
    });

    let centerLabel = new Gtk.Label({
        label: '<b>Active:</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    centerGrid.attach(centerLabel, 0, 3, 1, 1);

    let centerActive = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    centerGrid.attach(centerActive, 1, 3, 1, 1);

    let centerIndexLabel = new Gtk.Label({
        label: 'Index:',
        halign: Gtk.Align.START,
        visible: true
    });
    centerGrid.attach(centerIndexLabel, 0, 4, 1, 1);

    let centerIndex = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 10,
            step_increment: 1
        }),
        visible: true
    });
    centerGrid.attach(centerIndex, 1, 4, 1, 1);

    let centerCommandsJsonLabel = new Gtk.Label({
        label: 'Commands as JSON:',
        halign: Gtk.Align.START,
        visible: true
    });
    centerGrid.attach(centerCommandsJsonLabel, 0, 5, 1, 1);

    let centerCommandsJson = new Gtk.Entry({
        visible: true
    });
    centerGrid.attach(centerCommandsJson, 1, 5, 1, 1);

    let pageCenter = new Gtk.Box({
        visible: true
    });
    pageCenter.border_width = 10;
    pageCenter.add(centerGrid)
    notebook.append_page(pageCenter,new Gtk.Label({label: "Center", visible: true}));

    /* RIGHT */
    let rightGrid = new Gtk.Grid({
        /*margin: 18,*/
        column_spacing: 12,
        row_spacing: 12,
        visible: true,
        column_homogeneous: true,
        vexpand: true,
        hexpand: true
    });

    let rightLabel = new Gtk.Label({
        label: '<b>Active:</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    rightGrid.attach(rightLabel, 0, 6, 1, 1);

    let rightActive = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    rightGrid.attach(rightActive, 1, 6, 1, 1);

    let rightIndexLabel = new Gtk.Label({
        label: 'Index:',
        halign: Gtk.Align.START,
        visible: true
    });
    rightGrid.attach(rightIndexLabel, 0, 7, 1, 1);

    let rightIndex = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 10,
            step_increment: 1
        }),
        visible: true
    });
    rightGrid.attach(rightIndex, 1, 7, 1, 1);

    let commandsJsonLabel = new Gtk.Label({
        label: 'Commands as JSON:',
        halign: Gtk.Align.START,
        visible: true
    });
    rightGrid.attach(commandsJsonLabel, 0, 8, 1, 1);

    let rightCommandsJson = new Gtk.Entry({
        visible: true
    });
    rightGrid.attach(rightCommandsJson, 1, 8, 1, 1);

    let pageRight = new Gtk.Box({
        visible: true
    });
    pageRight.border_width = 10;
    pageRight.add(rightGrid)
    notebook.append_page(pageRight,new Gtk.Label({label: "Right", visible: true}));

    settings.bind('left-active', leftActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('left-index', leftIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('center-active', centerActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('center-index', centerIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('center-commands-json', centerCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-active', rightActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-index', rightIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-commands-json', rightCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}

function populateLeftCommands() {
    this.leftListBox.foreach((element) =>  this.leftListBox.remove(element));

    this.leftCommandsArray.forEach(c => {
        let row = new Gtk.ListBoxRow({visible: true});
        let command = new Gtk.Entry({
            visible: true
        });
        command.set_text(c.command);
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
        row.add(hbox);
        hbox.pack_start(command,true,true, 0);
        let interval = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 86400,
                step_increment: 1
            }),
            visible: true
        });
        interval.set_value(c.interval);
        hbox.pack_start(interval,false,true, 0);
        this.leftListBox.add(row);
    })
}

function leftAddButtonClicked() {
    this.leftCommandsArray.push({"command":"new command","interval":1})
    this.populateLeftCommands();
}