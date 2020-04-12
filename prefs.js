'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

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

    let prefsWidget = new Gtk.Grid({
        margin: 18,
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });

    let title = new Gtk.Label({
        label: '<b>' + Me.metadata.name + ' Extension Preferences</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 2, 1);

    let commandLabel = new Gtk.Label({
        label: 'Command to execute:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(commandLabel, 0, 1, 1, 1);

    let commandEntry = new Gtk.Entry();
    prefsWidget.attach(commandEntry, 1, 1, 1, 1);

    //button.connect('clicked', (button) => this.settings.reset('panel-states'));

    let intervalLabel = new Gtk.Label({
        label: 'Set execution interval (seconds):',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(intervalLabel, 0, 2, 1, 1);

    let intervalEntry = new Gtk.Entry();
    prefsWidget.attach(intervalEntry, 1, 2, 1, 1);

    settings.bind('command', commandEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('interval', intervalEntry, 'value', Gio.SettingsBindFlags.DEFAULT);

    // Return our widget which will be added to the window
    return prefsWidget;
}