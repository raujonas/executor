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

    let leftLabel = new Gtk.Label({
        label: '<b>Active:</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    leftGrid.attach(leftLabel, 0, 0, 1, 1);

    let leftActive = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    leftGrid.attach(leftActive, 1, 0, 1, 1);

    let leftIndexLabel = new Gtk.Label({
        label: 'Index:',
        halign: Gtk.Align.START,
        visible: true
    });
    leftGrid.attach(leftIndexLabel, 0, 1, 1, 1);

    let leftIndex = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 10,
            step_increment: 1
        }),
        visible: true
    });
    leftGrid.attach(leftIndex, 1, 1, 1, 1);

    let leftCommandsJsonLabel = new Gtk.Label({
        label: 'Commands as JSON:',
        halign: Gtk.Align.START,
        visible: true
    });
    leftGrid.attach(leftCommandsJsonLabel, 0, 2, 1, 1);

    let leftCommandsJson = new Gtk.Entry({
        visible: true
    });
    leftGrid.attach(leftCommandsJson, 1, 2, 1, 1);

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
    settings.bind('left-commands-json', leftCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('center-active', centerActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('center-index', centerIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('center-commands-json', centerCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-active', rightActive, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-index', rightIndex, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-commands-json', rightCommandsJson, 'text', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}