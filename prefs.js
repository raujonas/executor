'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

let gschema = Gio.SettingsSchemaSource.new_from_directory(
    Me.dir.get_child('schemas').get_path(),
    Gio.SettingsSchemaSource.get_default(),
    false
);

var settings = new Gio.Settings({
    settings_schema: gschema.lookup('org.gnome.shell.extensions.executor', true)
});

var notebook;
const POSITIONS = {
    0: 'left',
    1: 'center',
    2: 'right'
};
const POSTRANS = {
    0: _('Left'),
    1: _('Center'),
    2: _('Right')
};

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function buildPrefsWidget() {
    let prefsWidget = new Gtk.Grid({ visible: true, column_homogeneous: true });
    this.notebook = new Gtk.Notebook({ visible: true });
    prefsWidget.attach(this.notebook, 0, 0, 1, 1);
    this.commandsArray = {};
    this.commandsArrayCopy = {};
    this.listBox = {};
    let add;
    shellVersion < 40 ?
        add = 'add' :
        add = 'append';
    for (let position = 0; position < 3; position++) {
        this.commandsArray[position] = [];
        this.commandsArrayCopy[position] = [];
        try {
            this.commandsArray[position] = JSON.parse(this.settings.get_value(POSITIONS[position] + '-commands-json').deep_unpack()).commands;
            this.commandsArrayCopy[position] = JSON.parse(JSON.stringify(this.commandsArray[position]));
        } catch (e) {
            log('Error in json file for location: ' + location.name);
            this.settings.set_string(POSITIONS[position] + '-commands-json', '{"commands":[{"command":"echo Executor works!","interval":1}]}');
        }

        let grid = new Gtk.Grid({
            column_spacing: 12, row_spacing: 12,
            column_homogeneous: true,
            hexpand: true, vexpand: true,
            margin_start: 14, margin_end: 14, margin_top: 14, margin_bottom: 14,
            visible: true
        });

        let topHbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true });
        grid.attach(topHbox, 0, 0, 2, 1);

        let active = new Gtk.Switch({
            visible: true,
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            hexpand: true
        });
        active.set_active(this.settings.get_value(POSITIONS[position] + '-active').deep_unpack());
        active.connect("notify::active", () => {
            this.activeClicked(active.get_active());
        });
        let index = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 10, step_increment: 1 }), visible: true,
            xalign: 0.5
        });
        index.set_size_request(100, 0);
        topHbox[add](new Gtk.Label({ label: _('Active:'), use_markup: true, visible: true }));
        topHbox[add](active);
        topHbox[add](new Gtk.Label({ label: _('Index in status bar:'), visible: true, halign: Gtk.Align.END }));
        topHbox[add](index);

        grid.attach(new Gtk.Separator({ visible: true, orientation: Gtk.Orientation.VERTICAL }), 0, 1, 2, 1);
        grid.attach(new Gtk.Label({
            label: _('Command') + ' / ' + _('Interval in seconds') + ':',
            visible: true, halign: Gtk.Align.START
        }), 0, 2, 2, 1);

        this.listBox[position] = new Gtk.ListBox({ visible: true });
        this.listBox[position].set_selection_mode(0);
        grid.attach(this.listBox[position], 0, 3, 2, 1);
        this.populateCommandList(position);
        grid.attach(new Gtk.Separator({ visible: true, orientation: Gtk.Orientation.VERTICAL }), 0, 4, 2, 1);

        let buttonsHbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, visible: true, hexpand: true });

        let addButton = new Gtk.Button({
            visible: true, halign: Gtk.Align.START, hexpand: true,
            tooltip_text: _('Add new command')
        });
        let cancelButton = new Gtk.Button({
            visible: true, halign: Gtk.Align.END, hexpand: false,
            tooltip_text: _('Revert to last saved commands')
        });
        let saveButton = new Gtk.Button({
            visible: true, halign: Gtk.Align.END, hexpand: false,
            tooltip_text: _('Save commands')
        });

        if (shellVersion < 40) {
            addButton.set_image(new Gtk.Image({ icon_name: 'list-add-symbolic' })); // 'gtk-add'
            cancelButton.set_image(new Gtk.Image({ icon_name: 'document-revert-symbolic' })); // 'gtk-revert-to-saved            
            saveButton.set_image(new Gtk.Image({ icon_name: 'document-save-symbolic' })); // 'gtk-save'
        } else {
            addButton.set_icon_name('list-add-symbolic');
            cancelButton.set_icon_name('document-revert-symbolic');
            saveButton.set_icon_name('document-save-symbolic');
        }
        addButton.connect("clicked", this.addCommandToList.bind(this));
        cancelButton.connect("clicked", () => {
            this.commandsArray[position] = JSON.parse(JSON.stringify(this.commandsArrayCopy[position]));
            this.populateCommandList(position);
        });
        saveButton.connect("clicked", this.saveCommands.bind(this));
        buttonsHbox[add](addButton);
        buttonsHbox[add](cancelButton);
        buttonsHbox[add](saveButton);
        grid.attach(buttonsHbox, 0, 5, 2, 1);

        let pos = POSTRANS[position];
        this.notebook.append_page(grid, new Gtk.Label({ label: _(pos), visible: true, hexpand: true }));

        this.settings.bind(POSITIONS[position] + '-index', index, 'value', Gio.SettingsBindFlags.DEFAULT);
    }

    /* General tab */
    let grid = new Gtk.Grid({
        column_spacing: 12, row_spacing: 12,
        column_homogeneous: true,
        hexpand: true, vexpand: true,
        margin_start: 14, margin_end: 14, margin_top: 14, margin_bottom: 14,
        visible: true
    });
    let topHbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 20, visible: true });
    grid.attach(topHbox, 0, 0, 2, 1);

    let clickOnOutputActive = new Gtk.Switch({
        visible: true,
        halign: Gtk.Align.END,
        valign: Gtk.Align.CENTER,
        hexpand: true
    });
    clickOnOutputActive.set_active(this.settings.get_value('click-on-output-active').deep_unpack());
    clickOnOutputActive.connect("notify::active", () => {
        this.clickOnOutputActiveClicked(clickOnOutputActive.get_active());
    });
    topHbox[add](new Gtk.Label({ label: _('Click on output in top bar active:'), use_markup: true, visible: true }));
    topHbox[add](clickOnOutputActive);
    grid.attach(new Gtk.Separator({ visible: true, orientation: Gtk.Orientation.VERTICAL }), 0, 1, 2, 1);
    this.notebook.append_page(grid, new Gtk.Label({ label: _('General'), visible: true, hexpand: true }));
    /* End of general tab */

    this.notebook.set_current_page(this.settings.get_value('location').deep_unpack())
    this.notebook.connect('switch-page', (notebook, page, index) => {
        this.settings.set_int('location', index);
    })
    return prefsWidget;
}

function populateCommandList(page_number) {

    if (shellVersion < 40) {

        this.listBox[page_number].foreach((element) => this.listBox[page_number].remove(element));
        this.commandsArray[page_number].forEach((c, index) => {
            this.listBox[page_number].add(this.prepareRow(c, index));
        });

    } else {

        let child = this.listBox[page_number].get_first_child();
        while (child != null) {
            let next = child.get_next_sibling();
            this.listBox[page_number].remove(child);
            child = next;
        }
        this.commandsArray[page_number].forEach((c, index) => {
            this.listBox[page_number].append(this.prepareRow(c, index));
        });
    }
}

function prepareRow(c, index) {
    let add, addRow;
    if (shellVersion < 40) {
        add = 'add';
        addRow = 'add';
    } else {
        add = 'append';
        addRow = 'set_child';
    }

    let row = new Gtk.ListBoxRow({ visible: true });
    let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, visible: true });
    row[addRow](hbox);
    let isActiveButton = new Gtk.CheckButton({
        visible: true, margin_end: 10,
        tooltip_text: _('Command active')
    });
    if (c.isActive || c.isActive == null) {
        isActiveButton.set_active(true);
    }
    isActiveButton.connect("toggled", () => {
        isActiveButton.set_active(isActiveButton.get_active());
    });
    hbox[add](isActiveButton);
    let command = new Gtk.Entry({ visible: true, hexpand: true, margin_end: 10 });
    command.set_text(c.command);
    hbox[add](command);
    let interval = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({ lower: 1, upper: 86400, step_increment: 1 }),
        xalign: 0.5, visible: true, margin_end: 10
    });
    interval.set_value(c.interval);
    hbox[add](interval);

    let upButton = new Gtk.Button({
        visible: true, margin_end: 4,
        tooltip_text: _('Move command up')
    });
    let downButton = new Gtk.Button({
        visible: true, margin_end: 4,
        tooltip_text: _('Move command down')
    });
    let remove = new Gtk.Button({
        visible: true,
        tooltip_text: _('Remove command')
    });
    if (shellVersion < 40) {
        upButton.set_image(new Gtk.Image({ icon_name: 'go-up-symbolic' }));
        downButton.set_image(new Gtk.Image({ icon_name: 'go-down-symbolic' }));
        remove.set_image(new Gtk.Image({ icon_name: 'edit-delete-symbolic' }));
    } else {
        upButton.set_icon_name('go-up-symbolic');
        downButton.set_icon_name('go-down-symbolic');
        remove.set_icon_name('edit-delete-symbolic');
    }
    upButton.connect("clicked", () => {
        this.moveCommandUp(index);
    });
    downButton.connect("clicked", () => {
        this.moveCommandDown(index);
    });
    hbox[add](upButton);
    hbox[add](downButton);
    hbox[add](remove);
    remove.connect("clicked", () => {
        remove.set_sensitive(false);
        this.removeCommandFromList(index);
    });
    return row;
}

function addCommandToList() {
    let position = this.notebook.get_current_page();
    this.commandsArray[position].push({ "command": "echo 'new command'", "interval": 1 });
    this.populateCommandList(position);
}

function removeCommandFromList(index) {
    let position = this.notebook.get_current_page();
    this.commandsArray[position].splice(index, 1);
    this.populateCommandList(position);
}

function moveCommandUp(index) {
    let position = this.notebook.get_current_page();
    this.arraymove(this.commandsArray[position], index, index - 1);
    this.populateCommandList(position);
}

function moveCommandDown(index) {
    let position = this.notebook.get_current_page();
    this.arraymove(this.commandsArray[position], index, index + 1);
    this.populateCommandList(position);
}

function arraymove(array, fromIndex, toIndex) {
    let element = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, element);
}

function saveCommands() {

    let position = this.notebook.get_current_page();
    this.commandsArray[position].splice(0, this.commandsArray[position].length);

    let count = 0;

    if (shellVersion < 40) {
        this.listBox[position].foreach((element) => count++);
    } else {
        let child = this.listBox[position].get_first_child();
        while (child != null) {
            let next = child.get_next_sibling();
            count++;
            child = next;
        }
    }
    for (let i = 0; i < count; i++) {
        let isActive;
        let command;
        let interval;
        if (shellVersion < 40) {
            isActive = this.listBox[position].get_row_at_index(i).get_child().get_children()[0].get_active();
            command = this.listBox[position].get_row_at_index(i).get_child().get_children()[1].get_text();
            interval = this.listBox[position].get_row_at_index(i).get_child().get_children()[2].get_value();
        } else {
            let entry = this.listBox[position].get_row_at_index(i).get_child().get_first_child();
            isActive = entry.get_active();
            entry = entry.get_next_sibling();
            command = entry.get_text();
            entry = entry.get_next_sibling();
            interval = entry.get_value();
        }
        this.commandsArray[position].push({
            "isActive": isActive,
            "command": command,
            "interval": interval,
            "uuid": this.createUUID()
        });
    }

    this.commandsArrayCopy[position] = JSON.parse(JSON.stringify(this.commandsArray[position]));
    this.settings.set_string(POSITIONS[position] + '-commands-json', '{"commands":' + JSON.stringify(this.commandsArray[position]) + '}');
}

function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function activeClicked(isActive) {
    let position = this.notebook.get_current_page();
    if (isActive) {
        this.saveCommands();
    }

    this.settings.set_boolean(POSITIONS[position] + '-active', isActive);
}

function clickOnOutputActiveClicked(isActive) {
    this.settings.set_boolean('click-on-output-active', isActive);
}