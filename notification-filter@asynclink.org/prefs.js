'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Common from './common.js';

export default class NotificaitonFilterPreferences extends ExtensionPreferences {
  groups = [];
  titleRegexSwitchRows = [];
  titleMatchEntryRows = [];
  bodyRegexSwitchRows = [];
  bodyMatchEntryRows = [];
  settings = this.getSettings();

  /**
   * Primary preferences window fill function.
   */
  fillPreferencesWindow(window) {
    // Setup variables.
    var filters = Common.getFiltersFromSettings(this.settings);
    var page = new Adw.PreferencesPage();

    // Assign our current settings to the window.
    window._settings = this.settings;

    // Loop through and create all the widgets.
    for (var i = 0; i < Common.MAX_FILTERS; i++) {
      // Add group header.
      this.groups[i] = new Adw.PreferencesGroup({ title:'Filter Rule ' + (i + 1) });

      // Add title regex switch.
      this.titleRegexSwitchRows[i] = new Adw.SwitchRow( { title: 'Use regex to match title' });
      this.titleRegexSwitchRows[i].set_active(filters[i].title_regex);
      this.titleRegexSwitchRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(); });
      this.groups[i].add(this.titleRegexSwitchRows[i]);

      // Add title match string.
      this.titleMatchEntryRows[i] = new Adw.EntryRow( { title: 'Title text to match' });
      if(filters[i].title.toString().length > 0) { this.titleMatchEntryRows[i].set_text(filters[i].title.toString()); }
      this.titleMatchEntryRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(); });
      this.groups[i].add(this.titleMatchEntryRows[i]);

      // Add body regex switch.
      this.bodyRegexSwitchRows[i] = new Adw.SwitchRow( { title: 'Use regex to match body' });
      this.bodyRegexSwitchRows[i].set_active(filters[i].body_regex);
      this.bodyRegexSwitchRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(); });
      this.groups[i].add(this.bodyRegexSwitchRows[i]);

      // Add body match string.
      this.bodyMatchEntryRows[i] = new Adw.EntryRow( { title: 'Body text to match' });
      if(filters[i].body.toString().length > 0) { this.bodyMatchEntryRows[i].set_text(filters[i].body.toString()); }
      this.bodyMatchEntryRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(); });
      this.groups[i].add(this.bodyMatchEntryRows[i]);

      // Add group to page.
      page.add(this.groups[i]);
    }

    // Add the page to the preferences window.
    window.add(page);
  }

  /**
   * Save the settings whenever one is changed.  A bit wasteful, but needed for backwards compatibility.
   */
  _settingsChanged() {
    // Setup variables.
    var settingsToSave = [];

    // Loop through all the settings widgets and get their values.
    for (let i = 0; i < Common.MAX_FILTERS; i++) {
      // Make sure to clean up the text before using it.
      let title = this.titleMatchEntryRows[i].get_text().toString().trim();
      let body = this.bodyMatchEntryRows[i].get_text().toString().trim();

      // If there is no text to match, skip this entry.
      if(title.length > 0 || body.length > 0) {
        settingsToSave.push(new Common.FilterSetting(title, body, this.titleRegexSwitchRows[i].get_active().toString().trim(), this.bodyRegexSwitchRows[i].get_active().toString().trim()));
      }
    }

    // If we have no settings to save, reset them, otherwise write them out.
    if (settingsToSave.length == 0) {
      this.settings.reset('filters');
      Gio.Settings.sync();
    } else {
      this.settings.set_value('filters', new GLib.Variant('aa{ss}', settingsToSave));
      Gio.Settings.sync();
    };
  }
}
