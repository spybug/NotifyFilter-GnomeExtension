'use strict';

import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import {SettingsEditor} from './settingsInterface.js';
import * as common from './common.js';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class NotificaitonFilterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // css for all widgets
        const cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_path(this.dir.get_path() + '/prefs.css');
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );

        // get preferences from gsettings
        const settings = this.getSettings();
        const savedSettings = common.getFiltersFromSettings(settings);

        // Create the editor UI
        const editor = new SettingsEditor(savedSettings, settings);
        editor.create();


        window._settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const group = new Adw.PreferencesGroup({
            title:'Preferences',
        });
        page.add(group);

        window.add(page);
    }
}
