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

var settings = new Gio.Settings({
    settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
});

var leftCommandsArray = [];
var leftCommandsArrayCopy = [];
var leftListBox;
var centerCommandsArray = [];
var centerCommandsArrayCopy = [];
var centerListBox;
var rightCommandsArray = [];
var rightCommandsArrayCopy = [];
var rightListBox;

var notebook;

function init() {
}

function buildPrefsWidget() {    
    let prefsWidget = new Gtk.Grid({visible: true, column_homogeneous: true});

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

    let leftGrid = new Gtk.Grid({column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let leftTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    leftGrid.attach(leftTopHbox, 0, 0, 2, 1);

    let leftActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    leftActive.set_active(this.settings.get_value('left-active').deep_unpack());
    leftActive.connect("notify::active", () => {
        this.activeClicked(leftActive.get_active());
    });    
    let leftIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    leftIndex.set_size_request(125,0);
    leftTopHbox.append(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}));
    leftTopHbox.append(leftActive);
    leftTopHbox.append(new Gtk.Label({label: 'Index in status bar:', visible: true, halign: Gtk.Align.END, hexpand: true}));
    leftTopHbox.append(leftIndex);

    leftGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    leftGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.leftListBox = new Gtk.ListBox({visible: true});
    this.leftListBox.set_selection_mode(0);
    leftGrid.attach(this.leftListBox, 0, 3, 2, 1);
    this.populateCommandList(0);
    leftGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 4, 2, 1);

    let leftButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let leftAddButton = new Gtk.Button({visible: true, halign: Gtk.Align.START, hexpand: true});
    leftAddButton.set_icon_name("list-add");
    leftAddButton.connect("clicked", this.addCommandToList.bind(this));
    let leftSaveButton = new Gtk.Button({visible: true});
    leftSaveButton.set_icon_name("document-save");
    leftSaveButton.connect("clicked", this.saveCommands.bind(this));
    let leftCancelButton = new Gtk.Button({visible: true});
    leftCancelButton.set_icon_name("document-revert");
    leftCancelButton.connect("clicked", () => {
        this.leftCommandsArray = JSON.parse(JSON.stringify(this.leftCommandsArrayCopy));
        this.populateCommandList(0);
    });
    leftButtonsHbox.prepend(leftAddButton);
    leftButtonsHbox.append(leftSaveButton);
    leftButtonsHbox.append(leftCancelButton);
    leftGrid.attach(leftButtonsHbox, 0, 5, 2, 1);
    
    let pageLeft = new Gtk.Box({visible: true, margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10});
    pageLeft.border_width = 10;
    pageLeft.append(leftGrid);
    this.notebook.append_page(pageLeft,new Gtk.Label({label: "Left", visible: true}));

    /* CENTER */
    try {
        this.centerCommandsArray = JSON.parse(this.settings.get_value('center-commands-json').deep_unpack()).commands;
        this.centerCommandsArrayCopy = JSON.parse(JSON.stringify(this.centerCommandsArray));
    } catch (e) {
        log('Error in json file for location: ' + location.name);
        this.settings.set_string('center-commands-json', '{"commands":[{"command":"echo Executor works!","interval":1}]}');
    }

    let centerGrid = new Gtk.Grid({column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let centerTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    centerGrid.attach(centerTopHbox, 0, 0, 2, 1);

    let centerActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    centerActive.set_active(this.settings.get_value('center-active').deep_unpack());
    centerActive.connect("notify::active", () => {
        this.activeClicked(centerActive.get_active());
    });    
    let centerIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    centerIndex.set_size_request(125,0);
    centerTopHbox.append(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}));
    centerTopHbox.append(centerActive);
    centerTopHbox.append(new Gtk.Label({label: 'Index in status bar:', visible: true, halign: Gtk.Align.END, hexpand: true}));
    centerTopHbox.append(centerIndex);

    centerGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    centerGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.centerListBox = new Gtk.ListBox({visible: true});
    this.centerListBox.set_selection_mode(0);
    centerGrid.attach(this.centerListBox, 0, 3, 2, 1);
    this.populateCommandList(1);
    centerGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 4, 2, 1);

    let centerButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let centerAddButton = new Gtk.Button({visible: true, halign: Gtk.Align.START, hexpand: true});
    centerAddButton.set_icon_name("list-add");
    centerAddButton.connect("clicked", this.addCommandToList.bind(this));
    let centerSaveButton = new Gtk.Button({visible: true});
    centerSaveButton.set_icon_name("document-save");
    centerSaveButton.connect("clicked", this.saveCommands.bind(this));
    let centerCancelButton = new Gtk.Button({visible: true});
    centerCancelButton.set_icon_name("document-revert");
    centerCancelButton.connect("clicked", () => {
        this.centerCommandsArray = JSON.parse(JSON.stringify(this.centerCommandsArrayCopy));
        this.populateCommandList(1);
    });    
    centerButtonsHbox.prepend(centerAddButton);
    centerButtonsHbox.append(centerSaveButton);
    centerButtonsHbox.append(centerCancelButton);
    centerGrid.attach(centerButtonsHbox, 0, 5, 2, 1);
    
    let pageCenter = new Gtk.Box({visible: true, margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10});
    pageCenter.border_width = 10;
    pageCenter.append(centerGrid);
    this.notebook.append_page(pageCenter,new Gtk.Label({label: "Center", visible: true}));

    /* RIGHT */
    try {
        this.rightCommandsArray = JSON.parse(this.settings.get_value('right-commands-json').deep_unpack()).commands;
        this.rightCommandsArrayCopy = JSON.parse(JSON.stringify(this.rightCommandsArray));
    } catch (e) {
        log('Error in json file for location: ' + location.name);
        this.settings.set_string('right-commands-json', '{"commands":[{"command":"echo Executor works!","interval":1}]}');
    }

    let rightGrid = new Gtk.Grid({column_spacing: 12, row_spacing: 12, visible: true, column_homogeneous: true, vexpand: true, hexpand: true});

    let rightTopHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true});
    rightGrid.attach(rightTopHbox, 0, 0, 2, 1);

    let rightActive = new Gtk.Switch({visible: true, halign: Gtk.Align.CENTER});
    rightActive.set_active(this.settings.get_value('right-active').deep_unpack());
    rightActive.connect("notify::active", () => {
        this.activeClicked(rightActive.get_active());
    });    
    let rightIndex = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0, upper: 10, step_increment: 1}), visible: true});
    rightIndex.set_size_request(125,0);
    rightTopHbox.append(new Gtk.Label({label: 'Active:', use_markup: true, visible: true}));
    rightTopHbox.append(rightActive);
    rightTopHbox.append(new Gtk.Label({label: 'Index in status bar:', visible: true, halign: Gtk.Align.END, hexpand: true}));
    rightTopHbox.append(rightIndex);

    rightGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 1, 2, 1);
    rightGrid.attach(new Gtk.Label({label: 'Command    |    Interval in seconds:', visible: true}), 0, 2, 2, 1);

    this.rightListBox = new Gtk.ListBox({visible: true});
    this.rightListBox.set_selection_mode(0);
    rightGrid.attach(this.rightListBox, 0, 3, 2, 1);
    this.populateCommandList(2);
    rightGrid.attach(new Gtk.Separator({visible: true, orientation: Gtk.Orientation.VERTICAL}), 0, 4, 2, 1);

    let rightButtonsHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true});
    let rightAddButton = new Gtk.Button({visible: true, halign: Gtk.Align.START, hexpand: true});
    rightAddButton.set_icon_name("list-add");
    rightAddButton.connect("clicked", this.addCommandToList.bind(this));
    let rightSaveButton = new Gtk.Button({visible: true});
    rightSaveButton.set_icon_name("document-save");
    rightSaveButton.connect("clicked", this.saveCommands.bind(this));
    let rightCancelButton = new Gtk.Button({visible: true});
    rightCancelButton.set_icon_name("document-revert");
    rightCancelButton.connect("clicked", () => {
        this.rightCommandsArray = JSON.parse(JSON.stringify(this.rightCommandsArrayCopy));
        this.populateCommandList(2);
    });    
    rightButtonsHbox.prepend(rightAddButton);
    rightButtonsHbox.append(rightSaveButton);
    rightButtonsHbox.append(rightCancelButton);
    rightGrid.attach(rightButtonsHbox, 0, 5, 2, 1);
    
    let pageRight = new Gtk.Box({visible: true, margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10});
    pageRight.border_width = 10;
    pageRight.append(rightGrid);
    this.notebook.append_page(pageRight,new Gtk.Label({label: "Right", visible: true}));

    //this.settings.bind('left-active', leftActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('left-index', leftIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    //this.settings.bind('center-active', centerActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('center-index', centerIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    //this.settings.bind('right-active', rightActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    this.settings.bind('right-index', rightIndex, 'value', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}

function populateCommandList(page_number) {

    if (page_number === 0) {
    
        let child = this.leftListBox.get_first_child();
	    while (child != null) {
            let next = child.get_next_sibling();
            this.leftListBox.remove(child);
            child = next;
        }

        this.leftCommandsArray.forEach((c, index) => {
            this.leftListBox.append(this.prepareRow(c, index));
        })

    } else if (page_number === 1) {

	    let child = this.centerListBox.get_first_child();
	    while (child != null) {
            let next = child.get_next_sibling();
            this.centerListBox.remove(child);
            child = next;
        }

        this.centerCommandsArray.forEach((c, index) => {
            this.centerListBox.append(this.prepareRow(c, index));
        })

    } else if (page_number === 2) {

        let child = this.rightListBox.get_first_child();
	    while (child != null) {
            let next = child.get_next_sibling();
            this.rightListBox.remove(child);
            child = next;
        }
    	
        this.rightCommandsArray.forEach((c, index) => {
            this.rightListBox.append(this.prepareRow(c, index));
        })

    }
}

function prepareRow(c, index) {
    let row = new Gtk.ListBoxRow({visible: true});

    let command = new Gtk.Entry({visible: true, margin_end: 10, hexpand: true});
    command.set_text(c.command);
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, visible: true});
    row.set_child(hbox);
    hbox.append(command);

    let interval = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({lower: 0,upper: 86400,step_increment: 1}), visible: true, margin_end: 10});
    interval.set_value(c.interval);
    hbox.append(interval);

    let upButton = new Gtk.Button({visible: true, margin_end: 1});
    upButton.set_icon_name("go-up");
    upButton.connect("clicked", () => {
        this.moveCommandUp(index);
    });

    let downButton = new Gtk.Button({visible: true, margin_end: 1});
    downButton.set_icon_name("go-down");
    downButton.connect("clicked", () => {
        this.moveCommandDown(index);
    });

    hbox.append(upButton);
    hbox.append(downButton);

    let removeButton = new Gtk.Button({visible: true});
    removeButton.set_icon_name("edit-delete");
    hbox.append(removeButton);
    removeButton.connect("clicked", () => {
        this.removeCommandFromList(index);
        removeButton.set_sensitive(false);
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

function moveCommandUp(index) {

    if (this.notebook.get_current_page() === 0) {

        this.arraymove(this.leftCommandsArray, index, index - 1)
        this.populateCommandList(this.notebook.get_current_page());     

    } else if (this.notebook.get_current_page() === 1) {

        this.arraymove(this.centerCommandsArray, index, index - 1)
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 2) {

        this.arraymove(this.rightCommandsArray, index, index - 1)
        this.populateCommandList(this.notebook.get_current_page());        

    }
}

function moveCommandDown(index) {

    if (this.notebook.get_current_page() === 0) {

        this.arraymove(this.leftCommandsArray, index, index + 1)
        this.populateCommandList(this.notebook.get_current_page());     

    } else if (this.notebook.get_current_page() === 1) {

        this.arraymove(this.centerCommandsArray, index, index + 1)
        this.populateCommandList(this.notebook.get_current_page());

    } else if (this.notebook.get_current_page() === 2) {

        this.arraymove(this.rightCommandsArray, index, index + 1)
        this.populateCommandList(this.notebook.get_current_page());        

    }
}

function arraymove(array, fromIndex, toIndex) {
    var element = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, element);
}

function saveCommands() {

    if (this.notebook.get_current_page() === 0) {

        this.leftCommandsArray.splice(0, this.leftCommandsArray.length);

        let count = 0;
        
        let child = this.leftListBox.get_first_child();
	    while (child != null) {
            let next = child.get_next_sibling();
            count++;
            child = next;
        }
       
        for (var i = 0; i < count; i++) {
        
            let command = this.leftListBox.get_row_at_index(i).get_child().get_first_child();
            let interval = command.get_next_sibling();
                    
            this.leftCommandsArray.push({
                "command": command.get_text(),
                "interval": interval.get_value(),
                "uuid": this.createUUID()});
        }

        this.leftCommandsArrayCopy = JSON.parse(JSON.stringify(this.leftCommandsArray));

        this.settings.set_string('left-commands-json', '{"commands":' + JSON.stringify(this.leftCommandsArray) + '}');

    } else if (this.notebook.get_current_page() === 1) {

        this.centerCommandsArray.splice(0, this.centerCommandsArray.length);

        let count = 0;
        
        let child = this.centerListBox.get_first_child();
	    while (child != null) {
            let next = child.get_next_sibling();
            count++;
            child = next;
        }

        for (var i = 0; i < count; i++) {
            let command = this.centerListBox.get_row_at_index(i).get_child().get_first_child();
            let interval = command.get_next_sibling();
                    
            this.centerCommandsArray.push({
                "command": command.get_text(),
                "interval": interval.get_value(),
                "uuid": this.createUUID()});
        }

        this.centerCommandsArrayCopy = JSON.parse(JSON.stringify(this.centerCommandsArray));

        this.settings.set_string('center-commands-json', '{"commands":' + JSON.stringify(this.centerCommandsArray) + '}');


    } else if (this.notebook.get_current_page() === 2) {

        this.rightCommandsArray.splice(0, this.rightCommandsArray.length);

        let count = 0;
        
        let child = this.rightListBox.get_first_child();
	    while (child != null) {
            let next = child.get_next_sibling();
            count++;
            child = next;
        }

        for (var i = 0; i < count; i++) {
            let command = this.rightListBox.get_row_at_index(i).get_child().get_first_child();
            let interval = command.get_next_sibling();
                    
            this.rightCommandsArray.push({
                "command": command.get_text(),
                "interval": interval.get_value(),
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
  
function activeClicked(isActive) {

    if (isActive) {
        this.saveCommands();
    }

    if (this.notebook.get_current_page() === 0) {

        this.settings.set_boolean('left-active', isActive);

    } else if (this.notebook.get_current_page() === 1) {

        this.settings.set_boolean('center-active', isActive);

    } else if (this.notebook.get_current_page() === 2) {

        this.settings.set_boolean('right-active', isActive);

    }

}
