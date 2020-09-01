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

let leftCommandsArray = [];
let leftListBox;
let leftRemoveButton;
let centerCommandsArray = [];
let centerListBox;
let centerRemoveButton;
let rightCommandsArray = [];
let rightListBox;
let rightRemoveButton;

let notebook;

function init() {
}

function buildPrefsWidget() {    
    let prefsWidget = new Gtk.Grid({/*margin: 18, column_spacing: 12, row_spacing: 12,*/ visible: true, column_homogeneous: true});

    this.notebook = new Gtk.Notebook({visible: true});
    prefsWidget.attach(this.notebook, 0, 0, 1, 1);

    /* LEFT */
    this.leftCommandsArray = JSON.parse(this.settings.get_value('left-commands-json').deep_unpack()).commands;

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
    leftGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

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
    this.centerCommandsArray = JSON.parse(this.settings.get_value('center-commands-json').deep_unpack()).commands;

    let centerGrid = new Gtk.Grid({/*margin: 18,*/ column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let centerTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    centerGrid.attach(centerTopHbox, 0, 0, 2, 1);

    let centerActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    let centerIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    centerIndex.set_size_request(125,0);
    centerTopHbox.pack_start(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}),false,true, 0);
    centerTopHbox.pack_start(centerActive,false,true, 0);
    centerTopHbox.pack_start(new Gtk.Label({label: 'Index:', visible: true, halign: Gtk.Align.END}),true,true, 0);
    centerTopHbox.pack_start(centerIndex,false,true, 0);

    centerGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    centerGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.centerListBox = new Gtk.ListBox({visible: true});
    this.centerListBox.connect("row-selected", this.enableRemoveCommandButton.bind(this));
    centerGrid.attach(this.centerListBox, 0, 3, 2, 1);
    this.populateCommandList(1);

    let centerButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let centerAddButton = new Gtk.Button({visible: true, label: 'Add'});
    centerAddButton.connect("clicked", this.addCommandToList.bind(this));
    this.centerRemoveButton = new Gtk.Button({visible: true, label: 'Remove'});
    this.centerRemoveButton.set_sensitive(false);
    this.centerRemoveButton.connect("clicked", this.removeCommandFromList.bind(this));
    let centerSaveButton = new Gtk.Button({visible: true, label: 'Save'});
    centerSaveButton.connect("clicked", this.saveCommands.bind(this));
    centerButtonsHbox.pack_start(centerAddButton,false,true, 0);
    centerButtonsHbox.pack_start(this.centerRemoveButton,false,true, 0);
    centerButtonsHbox.pack_end(centerSaveButton,false,true, 0);
    centerGrid.attach(centerButtonsHbox, 0, 4, 2, 1);
    
    let pageCenter = new Gtk.Box({visible: true});
    pageCenter.border_width = 10;
    pageCenter.add(centerGrid);
    this.notebook.append_page(pageCenter,new Gtk.Label({label: "Center", visible: true}));

    /* RIGHT */
    this.rightCommandsArray = JSON.parse(this.settings.get_value('right-commands-json').deep_unpack()).commands;

    let rightGrid = new Gtk.Grid({/*margin: 18,*/ column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let rightTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    rightGrid.attach(rightTopHbox, 0, 0, 2, 1);

    let rightActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    let rightIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    rightIndex.set_size_request(125,0);
    rightTopHbox.pack_start(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}),false,true, 0);
    rightTopHbox.pack_start(rightActive,false,true, 0);
    rightTopHbox.pack_start(new Gtk.Label({label: 'Index:', visible: true, halign: Gtk.Align.END}),true,true, 0);
    rightTopHbox.pack_start(rightIndex,false,true, 0);

    rightGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    rightGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.rightListBox = new Gtk.ListBox({visible: true});
    this.rightListBox.connect("row-selected", this.enableRemoveCommandButton.bind(this));
    rightGrid.attach(this.rightListBox, 0, 3, 2, 1);
    this.populateCommandList(2);

    let rightButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let rightAddButton = new Gtk.Button({visible: true, label: 'Add'});
    rightAddButton.connect("clicked", this.addCommandToList.bind(this));
    this.rightRemoveButton = new Gtk.Button({visible: true, label: 'Remove'});
    this.rightRemoveButton.set_sensitive(false);
    this.rightRemoveButton.connect("clicked", this.removeCommandFromList.bind(this));
    let rightSaveButton = new Gtk.Button({visible: true, label: 'Save'});
    rightSaveButton.connect("clicked", this.saveCommands.bind(this));
    rightButtonsHbox.pack_start(rightAddButton,false,true, 0);
    rightButtonsHbox.pack_start(this.rightRemoveButton,false,true, 0);
    rightButtonsHbox.pack_end(rightSaveButton,false,true, 0);
    rightGrid.attach(rightButtonsHbox, 0, 4, 2, 1);
    
    let pageRight = new Gtk.Box({visible: true});
    pageRight.border_width = 10;
    pageRight.add(rightGrid);
    this.notebook.append_page(pageRight,new Gtk.Label({label: "Right", visible: true}));

    this.settings.bind('left-active', leftActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('left-index', leftIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('center-active', centerActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('center-index', centerIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('right-active', rightActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('right-index', rightIndex, 'value', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}

function populateCommandList(page_number) {

    if (page_number === 0) {

        this.leftListBox.foreach((element) => this.leftListBox.remove(element));
        this.leftCommandsArray.forEach(c => {
            this.leftListBox.add(this.prepareRow(c));
        })

    } else if (page_number === 1) {

        this.centerListBox.foreach((element) => this.centerListBox.remove(element));
        this.centerCommandsArray.forEach(c => {
            this.centerListBox.add(this.prepareRow(c));
        })

    } else if (page_number === 2) {

        this.rightListBox.foreach((element) => this.rightListBox.remove(element));
        this.rightCommandsArray.forEach(c => {
            this.rightListBox.add(this.prepareRow(c));
        })

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
    
    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.push({"command":"new command","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 1) {

        this.centerCommandsArray.push({"command":"new command","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 2) {

        this.rightCommandsArray.push({"command":"new command","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    }
}

function enableRemoveCommandButton() {

    if (this.notebook.get_current_page() === 0) {

        this.leftRemoveButton.set_sensitive(true);

    } else if (this.notebook.get_current_page() === 1) {

        this.centerRemoveButton.set_sensitive(true);

    } else if (this.notebook.get_current_page() === 2) {

        this.rightRemoveButton.set_sensitive(true);

    }
}

function removeCommandFromList() {

    if (this.notebook.get_current_page() === 0) {

        this.leftRemoveButton.set_sensitive(false);
        this.leftCommandsArray.splice(this.leftListBox.get_selected_row().get_index(), 1);
        this.populateCommandList(this.notebook.get_current_page());
        this.leftRemoveButton.set_sensitive(true);

    } else if (this.notebook.get_current_page() === 1) {

        this.centerRemoveButton.set_sensitive(false);
        this.centerCommandsArray.splice(this.centerListBox.get_selected_row().get_index(), 1);
        this.populateCommandList(this.notebook.get_current_page());
        this.centerRemoveButton.set_sensitive(true);

    } else if (this.notebook.get_current_page() === 2) {

        this.rightRemoveButton.set_sensitive(false);
        this.rightCommandsArray.splice(this.rightListBox.get_selected_row().get_index(), 1);
        this.populateCommandList(this.notebook.get_current_page());
        this.rightRemoveButton.set_sensitive(true);

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

        this.centerCommandsArray.splice(0, this.centerCommandsArray.length);

        let count = 0;
        this.centerListBox.foreach((element) => count++);

        for (var i = 0; i < count; i++) {
            this.centerCommandsArray.push({"command": this.centerListBox.get_row_at_index(i).get_child().get_children()[0].get_text(),"interval": this.centerListBox.get_row_at_index(i).get_child().get_children()[1].get_value()});
            this.centerRemoveButton.set_sensitive(false);
        }

        this.settings.set_string('center-commands-json', '{"commands":' + JSON.stringify(this.centerCommandsArray) + '}');


    } else if (this.notebook.get_current_page() === 2) {

        this.rightCommandsArray.splice(0, this.rightCommandsArray.length);

        let count = 0;
        this.rightListBox.foreach((element) => count++);

        for (var i = 0; i < count; i++) {
            this.rightCommandsArray.push({"command": this.rightListBox.get_row_at_index(i).get_child().get_children()[0].get_text(),"interval": this.rightListBox.get_row_at_index(i).get_child().get_children()[1].get_value()});
            this.rightRemoveButton.set_sensitive(false);
        }

        this.settings.set_string('right-commands-json', '{"commands":' + JSON.stringify(this.rightCommandsArray) + '}');


    }

}