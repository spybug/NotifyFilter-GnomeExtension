'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Common from './common.js';

export default class NotificaitonFilterPreferences extends ExtensionPreferences {
  /**
   * Primary preferences window fill function.
   */
  fillPreferencesWindow(window) {
    // Setup variables.
    var groups = [];
    var titleRegexSwitchRows = [];
    var titleMatchEntryRows = [];
    var bodyRegexSwitchRows = [];
    var bodyMatchEntryRows = [];
    var settings = this.getSettings();
    var filters = Common.getFiltersFromSettings(settings);
    var page = new Adw.PreferencesPage();

    // Assign our current settings to the window.
    window._settings = settings;

    // Loop through and create all the widgets.
    for (var i = 0; i < Common.MAX_FILTERS; i++) {
      // Add group header.
      groups[i] = new Adw.PreferencesGroup({ title:_('Filter Rule') + ' ' + (i + 1) });

      // Add title regex switch.
      titleRegexSwitchRows[i] = new Adw.SwitchRow( { title: _('Use regex to match title') });
      titleRegexSwitchRows[i].set_active(filters[i].title_regex);
      titleRegexSwitchRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(titleMatchEntryRows, titleRegexSwitchRows, bodyMatchEntryRows, bodyRegexSwitchRows); });
      groups[i].add(titleRegexSwitchRows[i]);

      // Add title match string.
      titleMatchEntryRows[i] = new Adw.EntryRow( { title: _('Title text to match') });
      if(filters[i].title.toString().length > 0) { titleMatchEntryRows[i].set_text(filters[i].title.toString()); }
      titleMatchEntryRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(titleMatchEntryRows, titleRegexSwitchRows, bodyMatchEntryRows, bodyRegexSwitchRows); });
      groups[i].add(titleMatchEntryRows[i]);

      // Add body regex switch.
      bodyRegexSwitchRows[i] = new Adw.SwitchRow( { title: _('Use regex to match body') });
      bodyRegexSwitchRows[i].set_active(filters[i].body_regex);
      bodyRegexSwitchRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(titleMatchEntryRows, titleRegexSwitchRows, bodyMatchEntryRows, bodyRegexSwitchRows); });
      groups[i].add(bodyRegexSwitchRows[i]);

      // Add body match string.
      bodyMatchEntryRows[i] = new Adw.EntryRow( { title: _('Body text to match') });
      if(filters[i].body.toString().length > 0) { bodyMatchEntryRows[i].set_text(filters[i].body.toString()); }
      bodyMatchEntryRows[i].connect('notify::active', (object, _pspec) => { this._settingsChanged(titleMatchEntryRows, titleRegexSwitchRows, bodyMatchEntryRows, bodyRegexSwitchRows); });
      groups[i].add(bodyMatchEntryRows[i]);

      // Add group to page.
      page.add(groups[i]);
    }

    // Add the page to the preferences window.
    window.add(page);
  }

  /**
   * Save the settings whenever one is changed.  A bit wasteful, but needed for backwards compatibility.
   */
  _settingsChanged(titleMatchEntryRows, titleRegexSwitchRows, bodyMatchEntryRows, bodyRegexSwitchRows) {
    // Setup variables.
    var settings = this.getSettings();
    var settingsToSave = [];

    // Loop through all the settings widgets and get their values.
    for (let i = 0; i < Common.MAX_FILTERS; i++) {
      // Make sure to clean up the text before using it.
      let title = titleMatchEntryRows[i].get_text().toString().trim();
      let body = bodyMatchEntryRows[i].get_text().toString().trim();

      // If there is no text to match, skip this entry.
      if(title.length > 0 || body.length > 0) {
        settingsToSave.push(new Common.FilterSetting(title, body, titleRegexSwitchRows[i].get_active().toString().trim(), bodyRegexSwitchRows[i].get_active().toString().trim()));
      }
    }

    // If we have no settings to save, reset them, otherwise write them out.
    if (settingsToSave.length == 0) {
      settings.reset('filters');
      Gio.Settings.sync();
    } else {
      settings.set_value('filters', new GLib.Variant('aa{ss}', settingsToSave));
      Gio.Settings.sync();
    };
  }
}
