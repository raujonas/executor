'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let gschema = Gio.SettingsSchemaSource.new_from_directory(
    Me.dir.get_child('schemas').get_path(),
    Gio.SettingsSchemaSource.get_default(),
    false
);

let settings = new Gio.Settings({
    settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
});

let leftCommandsArray = []
let leftListBox;
let leftRemoveButton;

let notebook;

function init() {
}

function buildPrefsWidget() {

    this.leftCommandsArray = JSON.parse(this.settings.get_value('left-commands-json').deep_unpack()).commands;
    
    let prefsWidget = new Gtk.Grid({/*margin: 18, column_spacing: 12, row_spacing: 12,*/ visible: true, column_homogeneous: true});

    this.notebook = new Gtk.Notebook({visible: true});
    prefsWidget.attach(this.notebook, 0, 0, 1, 1);

    /* LEFT */
    let leftGrid = new Gtk.Grid({/*margin: 18,*/ column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let leftTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    leftGrid.attach(leftTopHbox, 0, 0, 2, 1);

    let leftActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    let leftIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    leftIndex.set_size_request(125,0);
    leftTopHbox.pack_start(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}),false,true, 0);
    leftTopHbox.pack_start(leftActive,false,true, 0);
    leftTopHbox.pack_start(new Gtk.Label({label: 'Index:', visible: true, halign: Gtk.Align.END}),true,true, 0);
    leftTopHbox.pack_start(leftIndex,false,true, 0);

    leftGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    leftGrid.attach(new Gtk.Label({label: 'Commands (quotation marks / backslashes need to be escaped) | Intervals in seconds:', visible: true}), 0, 2, 2, 1);

    this.leftListBox = new Gtk.ListBox({visible: true});
    this.leftListBox.connect("row-selected", this.enableRemoveCommandButton.bind(this));
    leftGrid.attach(this.leftListBox, 0, 3, 2, 1);
    this.populateCommandList(0);

    let leftButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let leftAddButton = new Gtk.Button({visible: true, label: 'Add'});
    leftAddButton.connect("clicked", this.addCommandToList.bind(this));
    this.leftRemoveButton = new Gtk.Button({visible: true, label: 'Remove'});
    this.leftRemoveButton.set_sensitive(false);
    this.leftRemoveButton.connect("clicked", this.removeCommandFromList.bind(this));
    let leftSaveButton = new Gtk.Button({visible: true, label: 'Save'});
    leftSaveButton.connect("clicked", this.saveCommands.bind(this));
    leftButtonsHbox.pack_start(leftAddButton,false,true, 0);
    leftButtonsHbox.pack_start(this.leftRemoveButton,false,true, 0);
    leftButtonsHbox.pack_end(leftSaveButton,false,true, 0);
    leftGrid.attach(leftButtonsHbox, 0, 4, 2, 1);
    
    let pageLeft = new Gtk.Box({visible: true});
    pageLeft.border_width = 10;
    pageLeft.add(leftGrid);
    this.notebook.append_page(pageLeft,new Gtk.Label({label: "Left", visible: true}));

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
    this.notebook.append_page(pageCenter,new Gtk.Label({label: "Center", visible: true}));

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
    this.notebook.append_page(pageRight,new Gtk.Label({label: "Right", visible: true}));

    this.settings.bind('left-active', leftActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('left-index', leftIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('center-active', centerActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('center-index', centerIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('center-commands-json', centerCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('right-active', rightActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('right-index', rightIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('right-commands-json', rightCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}

function populateCommandList(page_number) {

    if (page_number === 0) {

        this.leftListBox.foreach((element) => this.leftListBox.remove(element));

        this.leftCommandsArray.forEach(c => {
            this.leftListBox.add(this.prepareRow(c));
        })

    } else if (page_number === 1) {

    } else if (page_number === 2) {

    }
}

function prepareRow(c) {
    let row = new Gtk.ListBoxRow({visible: true});
    let command = new Gtk.Entry({visible: true});
    command.set_text(c.command);
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    row.add(hbox);
    hbox.pack_start(command,true,true, 0);
    let interval = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0,upper: 86400,step_increment: 1}),visible: true});
    interval.set_value(c.interval);
    hbox.pack_start(interval,false,true, 0);
    
    return row;
}

function addCommandToList() {
    
    //case left
    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.push({"command":"new command","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 1) {

    } else if (this.notebook.get_current_page() === 2) {

    }
}

function enableRemoveCommandButton() {

    if (this.notebook.get_current_page() === 0) {

        this.leftRemoveButton.set_sensitive(true);

    } else if (this.notebook.get_current_page() === 1) {

    } else if (this.notebook.get_current_page() === 2) {

    }
}

function removeCommandFromList() {

    if (this.notebook.get_current_page() === 0) {

        this.leftRemoveButton.set_sensitive(false);
        this.leftCommandsArray.splice(this.leftListBox.get_selected_row().get_index(), 1);
        this.populateCommandList(this.notebook.get_current_page());
        this.leftRemoveButton.set_sensitive(true);

    } else if (this.notebook.get_current_page() === 1) {

    } else if (this.notebook.get_current_page() === 2) {

    }
}

function saveCommands() {

    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.splice(0, this.leftCommandsArray.length);

        let count = 0;
        this.leftListBox.foreach((element) => count++);

        for (var i = 0; i < count; i++) {
            this.leftCommandsArray.push({"command": this.leftListBox.get_row_at_index(i).get_child().get_children()[0].get_text(),"interval": this.leftListBox.get_row_at_index(i).get_child().get_children()[1].get_value()});
            this.leftRemoveButton.set_sensitive(false);
        }

        this.settings.set_string('left-commands-json', '{"commands":' + JSON.stringify(this.leftCommandsArray) + '}');

    } else if (this.notebook.get_current_page() === 1) {

    } else if (this.notebook.get_current_page() === 2) {

    }

}