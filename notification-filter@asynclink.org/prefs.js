'use strict';

const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const settings = ExtensionUtils.getSettings(
  'org.gnome.shell.extensions.notification-filter'
);
const SettingsEditor = Me.imports.settingsInterface.SettingsEditor;
const FilterSetting = Me.imports.common.FilterSetting;
const common = Me.imports.common;

let savedSettings;

function init() {
  // css for all widgets
  readCss();

  // get preferences from gsettings
  savedSettings = common.getFiltersFromSettings(settings);
}

/**
 * Called when the preferences window is first created to build and return a Gtk widget.
 */
function buildPrefsWidget() {
  const editor = new SettingsEditor(savedSettings);
  editor.create();
  return editor.getWidget();
}

/**
 * Read CSS file and provide styles to all widgets specifying `css_classes` property.
 */
const readCss = function () {
  const cssProvider = new Gtk.CssProvider();
  cssProvider.load_from_path(Me.dir.get_path() + '/prefs.css');
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    cssProvider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
  );
};
