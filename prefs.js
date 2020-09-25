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
let leftCommandsArrayCopy = [];
let leftListBox;
let centerCommandsArray = [];
let centerCommandsArrayCopy = [];
let centerListBox;
let rightCommandsArray = [];
let rightCommandsArrayCopy = [];
let rightListBox;

let notebook;

function init() {
}

function buildPrefsWidget() {    
    let prefsWidget = new Gtk.Grid({/*margin: 18, column_spacing: 12, row_spacing: 12,*/ visible: true, column_homogeneous: true});

    this.notebook = new Gtk.Notebook({visible: true});
    prefsWidget.attach(this.notebook, 0, 0, 1, 1);

    /* LEFT */
    try {
        this.leftCommandsArray = JSON.parse(this.settings.get_value('left-commands-json').deep_unpack()).commands;
        this.leftCommandsArrayCopy = JSON.parse(JSON.stringify(this.leftCommandsArray));
    } catch (e) {
        log('Error in json file for location: ' + location.name);
        this.settings.set_string('left-commands-json', '{"commands":[{"command":"echo Executor works!","interval":1}]}');
    }

    let leftGrid = new Gtk.Grid({/*margin: 18,*/ column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let leftTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    leftGrid.attach(leftTopHbox, 0, 0, 2, 1);

    let leftActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    let leftIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    leftIndex.set_size_request(125,0);
    leftTopHbox.pack_start(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}),false,true, 0);
    leftTopHbox.pack_start(leftActive,false,true, 0);
    leftTopHbox.pack_start(new Gtk.Label({label: 'Index in status bar:', visible: true, halign: Gtk.Align.END}),true,true, 0);
    leftTopHbox.pack_start(leftIndex,false,true, 0);

    leftGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    leftGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.leftListBox = new Gtk.ListBox({visible: true});
    this.leftListBox.set_selection_mode(0);
    leftGrid.attach(this.leftListBox, 0, 3, 2, 1);
    this.populateCommandList(0);

    let leftButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let leftAddButton = new Gtk.Button({visible: true});
    let leftAddButtonImage = new Gtk.Image({visible: true});
    leftAddButtonImage.set_from_stock(Gtk.STOCK_ADD , 20);
    leftAddButton.set_image(leftAddButtonImage);
    leftAddButton.connect("clicked", this.addCommandToList.bind(this));
    let leftSaveButton = new Gtk.Button({visible: true});
    let leftSaveButtonImage = new Gtk.Image({visible: true});
    leftSaveButtonImage.set_from_stock(Gtk.STOCK_SAVE , 20);
    leftSaveButton.set_image(leftSaveButtonImage);
    leftSaveButton.connect("clicked", this.saveCommands.bind(this));
    let leftCancelButton = new Gtk.Button({visible: true});
    let leftCancelButtonImage = new Gtk.Image({visible: true});
    leftCancelButtonImage.set_from_stock(Gtk.STOCK_REVERT_TO_SAVED , 20);
    leftCancelButton.set_image(leftCancelButtonImage);
    leftCancelButton.connect("clicked", () => {
        this.leftCommandsArray = JSON.parse(JSON.stringify(this.leftCommandsArrayCopy));
        this.populateCommandList(0);
    });
    leftButtonsHbox.pack_start(leftAddButton,false,true, 0);
    leftButtonsHbox.pack_end(leftSaveButton,false,true, 0);
    leftButtonsHbox.pack_end(leftCancelButton,false,true, 0);
    leftGrid.attach(leftButtonsHbox, 0, 4, 2, 1);
    
    let pageLeft = new Gtk.Box({visible: true});
    pageLeft.border_width = 10;
    pageLeft.add(leftGrid);
    this.notebook.append_page(pageLeft,new Gtk.Label({label: "Left", visible: true}));

    /* CENTER */
    try {
        this.centerCommandsArray = JSON.parse(this.settings.get_value('center-commands-json').deep_unpack()).commands;
        this.centerCommandsArrayCopy = JSON.parse(JSON.stringify(this.centerCommandsArray));
    } catch (e) {
        log('Error in json file for location: ' + location.name);
        this.settings.set_string('center-commands-json', '{"commands":[{"command":"echo Executor works!","interval":1}]}');
    }

    let centerGrid = new Gtk.Grid({/*margin: 18,*/ column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let centerTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    centerGrid.attach(centerTopHbox, 0, 0, 2, 1);

    let centerActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    let centerIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    centerIndex.set_size_request(125,0);
    centerTopHbox.pack_start(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}),false,true, 0);
    centerTopHbox.pack_start(centerActive,false,true, 0);
    centerTopHbox.pack_start(new Gtk.Label({label: 'Index in status bar:', visible: true, halign: Gtk.Align.END}),true,true, 0);
    centerTopHbox.pack_start(centerIndex,false,true, 0);

    centerGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    centerGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.centerListBox = new Gtk.ListBox({visible: true});
    this.centerListBox.set_selection_mode(0);
    centerGrid.attach(this.centerListBox, 0, 3, 2, 1);
    this.populateCommandList(1);

    let centerButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let centerAddButton = new Gtk.Button({visible: true});
    let centerAddButtonImage = new Gtk.Image({visible: true});
    centerAddButtonImage.set_from_stock(Gtk.STOCK_ADD , 20);
    centerAddButton.set_image(centerAddButtonImage);
    centerAddButton.connect("clicked", this.addCommandToList.bind(this));
    let centerSaveButton = new Gtk.Button({visible: true});
    let centerSaveButtonImage = new Gtk.Image({visible: true});
    centerSaveButtonImage.set_from_stock(Gtk.STOCK_SAVE , 20);
    centerSaveButton.set_image(centerSaveButtonImage);
    centerSaveButton.connect("clicked", this.saveCommands.bind(this));
    let centerCancelButton = new Gtk.Button({visible: true});
    let centerCancelButtonImage = new Gtk.Image({visible: true});
    centerCancelButtonImage.set_from_stock(Gtk.STOCK_REVERT_TO_SAVED , 20);
    centerCancelButton.set_image(centerCancelButtonImage);
    centerCancelButton.connect("clicked", () => {
        this.centerCommandsArray = JSON.parse(JSON.stringify(this.centerCommandsArrayCopy));
        this.populateCommandList(1);
    });    
    centerButtonsHbox.pack_start(centerAddButton,false,true, 0);
    centerButtonsHbox.pack_end(centerSaveButton,false,true, 0);
    centerButtonsHbox.pack_end(centerCancelButton,false,true, 0);
    centerGrid.attach(centerButtonsHbox, 0, 4, 2, 1);
    
    let pageCenter = new Gtk.Box({visible: true});
    pageCenter.border_width = 10;
    pageCenter.add(centerGrid);
    this.notebook.append_page(pageCenter,new Gtk.Label({label: "Center", visible: true}));

    /* RIGHT */
    try {
        this.rightCommandsArray = JSON.parse(this.settings.get_value('right-commands-json').deep_unpack()).commands;
        this.rightCommandsArrayCopy = JSON.parse(JSON.stringify(this.rightCommandsArray));
    } catch (e) {
        log('Error in json file for location: ' + location.name);
        this.settings.set_string('right-commands-json', '{"commands":[{"command":"echo Executor works!","interval":1}]}');
    }

    let rightGrid = new Gtk.Grid({/*margin: 18,*/ column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let rightTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    rightGrid.attach(rightTopHbox, 0, 0, 2, 1);

    let rightActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    let rightIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    rightIndex.set_size_request(125,0);
    rightTopHbox.pack_start(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}),false,true, 0);
    rightTopHbox.pack_start(rightActive,false,true, 0);
    rightTopHbox.pack_start(new Gtk.Label({label: 'Index in status bar:', visible: true, halign: Gtk.Align.END}),true,true, 0);
    rightTopHbox.pack_start(rightIndex,false,true, 0);

    rightGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    rightGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.rightListBox = new Gtk.ListBox({visible: true});
    this.rightListBox.set_selection_mode(0);
    rightGrid.attach(this.rightListBox, 0, 3, 2, 1);
    this.populateCommandList(2);

    let rightButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let rightAddButton = new Gtk.Button({visible: true});
    let rightAddButtonImage = new Gtk.Image({visible: true});
    rightAddButtonImage.set_from_stock(Gtk.STOCK_ADD , 20);
    rightAddButton.set_image(rightAddButtonImage);
    rightAddButton.connect("clicked", this.addCommandToList.bind(this));
    let rightSaveButton = new Gtk.Button({visible: true});
    let rightSaveButtonImage = new Gtk.Image({visible: true});
    rightSaveButtonImage.set_from_stock(Gtk.STOCK_SAVE , 20);
    rightSaveButton.set_image(rightSaveButtonImage);
    rightSaveButton.connect("clicked", this.saveCommands.bind(this));
    let rightCancelButton = new Gtk.Button({visible: true});
    let rightCancelButtonImage = new Gtk.Image({visible: true});
    rightCancelButtonImage.set_from_stock(Gtk.STOCK_REVERT_TO_SAVED , 20);
    rightCancelButton.set_image(rightCancelButtonImage);
    rightCancelButton.connect("clicked", () => {
        this.rightCommandsArray = JSON.parse(JSON.stringify(this.rightCommandsArrayCopy));
        this.populateCommandList(2);
    });    
    rightButtonsHbox.pack_start(rightAddButton,false,true, 0);
    rightButtonsHbox.pack_end(rightSaveButton,false,true, 0);
    rightButtonsHbox.pack_end(rightCancelButton,false,true, 0);
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
        this.leftCommandsArray.forEach((c, index) => {
            this.leftListBox.add(this.prepareRow(c, index));
        })

    } else if (page_number === 1) {

        this.centerListBox.foreach((element) => this.centerListBox.remove(element));
        this.centerCommandsArray.forEach((c, index) => {
            this.centerListBox.add(this.prepareRow(c, index));
        })

    } else if (page_number === 2) {

        this.rightListBox.foreach((element) => this.rightListBox.remove(element));
        this.rightCommandsArray.forEach((c, index) => {
            this.rightListBox.add(this.prepareRow(c, index));
        })

    }
}

function prepareRow(c, index) {
    let row = new Gtk.ListBoxRow({visible: true});
    let command = new Gtk.Entry({visible: true});
    command.set_text(c.command);
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    row.add(hbox);
    hbox.pack_start(command,true,true, 0);
    let interval = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0,upper: 86400,step_increment: 1}),visible: true});
    interval.set_value(c.interval);
    hbox.pack_start(interval,false,true, 0);
    let remove = new Gtk.Button({visible: true});
    let removeImage = new Gtk.Image({visible: true});
    removeImage.set_from_stock(Gtk.STOCK_DELETE, 10);
    remove.set_image(removeImage);
    hbox.pack_start(remove,false,true, 0);
    remove.connect("clicked", () => {
        this.removeCommandFromList(index);
        this.leftRemoveButton.set_sensitive(false)
    });

    return row;
}

function addCommandToList() {
    
    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.push({"command":"echo 'new command'","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 1) {

        this.centerCommandsArray.push({"command":"echo 'new command'","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 2) {

        this.rightCommandsArray.push({"command":"echo 'new command'","interval":1})
        this.populateCommandList(this.notebook.get_current_page());

    }
}

function removeCommandFromList(index) {

    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.splice(index, 1);
        this.populateCommandList(this.notebook.get_current_page());     

    } else if (this.notebook.get_current_page() === 1) {

        this.centerCommandsArray.splice(index, 1);
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 2) {

        this.rightCommandsArray.splice(index, 1);
        this.populateCommandList(this.notebook.get_current_page());        

    }
}

function saveCommands() {

    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.splice(0, this.leftCommandsArray.length);

        let count = 0;
        this.leftListBox.foreach((element) => count++);

        for (var i = 0; i < count; i++) {
            this.leftCommandsArray.push({
                "command": this.leftListBox.get_row_at_index(i).get_child().get_children()[0].get_text(),
                "interval": this.leftListBox.get_row_at_index(i).get_child().get_children()[1].get_value(),
                "uuid": this.createUUID()});
        }

        this.leftCommandsArrayCopy = JSON.parse(JSON.stringify(this.leftCommandsArray));

        this.settings.set_string('left-commands-json', '{"commands":' + JSON.stringify(this.leftCommandsArray) + '}');

    } else if (this.notebook.get_current_page() === 1) {

        this.centerCommandsArray.splice(0, this.centerCommandsArray.length);

        let count = 0;
        this.centerListBox.foreach((element) => count++);

        for (var i = 0; i < count; i++) {
            this.centerCommandsArray.push({
                "command": this.centerListBox.get_row_at_index(i).get_child().get_children()[0].get_text(),
                "interval": this.centerListBox.get_row_at_index(i).get_child().get_children()[1].get_value(),
                "uuid": this.createUUID()});
        }

        this.centerCommandsArrayCopy = JSON.parse(JSON.stringify(this.centerCommandsArray));

        this.settings.set_string('center-commands-json', '{"commands":' + JSON.stringify(this.centerCommandsArray) + '}');


    } else if (this.notebook.get_current_page() === 2) {

        this.rightCommandsArray.splice(0, this.rightCommandsArray.length);

        let count = 0;
        this.rightListBox.foreach((element) => count++);

        for (var i = 0; i < count; i++) {
            this.rightCommandsArray.push({
                "command": this.rightListBox.get_row_at_index(i).get_child().get_children()[0].get_text(),
                "interval": this.rightListBox.get_row_at_index(i).get_child().get_children()[1].get_value(),
                "uuid": this.createUUID()});
        }

        this.rightCommandsArrayCopy = JSON.parse(JSON.stringify(this.rightCommandsArray));

        this.settings.set_string('right-commands-json', '{"commands":' + JSON.stringify(this.rightCommandsArray) + '}');
    }
}

function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  
