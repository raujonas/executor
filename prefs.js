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
        visible: true,
        column_homogeneous: true,
    });

    let rightLabel = new Gtk.Label({
        label: '<b>Right:</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(rightLabel, 0, 0, 1, 1);

    let rightActive = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    prefsWidget.attach(rightActive, 1, 0, 1, 1);

    let rightIndexLabel = new Gtk.Label({
        label: 'Index:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(rightIndexLabel, 0, 1, 1, 1);

    let rightIndex = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 1,
            upper: 10,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(rightIndex, 1, 1, 1, 1);

    let commandsJsonLabel = new Gtk.Label({
        label: 'Commands as JSON:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(commandsJsonLabel, 0, 2, 1, 1);

    let rightCommandsJson = new Gtk.Entry({
        visible: true
    });
    prefsWidget.attach(rightCommandsJson, 1, 2, 1, 1);

    settings.bind('right-active', rightActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-index', rightIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-commands-json', rightCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}