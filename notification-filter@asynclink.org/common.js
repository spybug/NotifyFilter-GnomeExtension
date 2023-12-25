'use strict';

import Gtk from 'gi://Gtk';

/**
 * Read and parse preferences from GSettings.
 *
 * @param settings for extension
 * @returns a list of FilterSetting objects
 */
export function getFiltersFromSettings(settings) {
  const unpackedSettings = settings.get_value('filters').deep_unpack();
  const loadedSettings = [];
  for (let i = 0; i < unpackedSettings.length; i++) {
    const rawSetting = unpackedSettings[i];
    const title = rawSetting.title || '';
    const body = rawSetting.body || '';
    const title_regex = rawSetting.title_regex ? rawSetting.title_regex.trim().toLowerCase() === 'true' : false;
    const body_regex = rawSetting.body_regex ? rawSetting.body_regex.trim().toLowerCase() === 'true' : false;
    loadedSettings.push(new FilterSetting(title.trim(), body.trim(), title_regex, body_regex));
  }
  return loadedSettings;
}

/**
 * Structure for a Filter object.
 *
 * @param {String} title
 * @param {String} body
 * @param {boolean} title_regex
 * @param {boolean} body_regex
 */
var FilterSetting = class FilterSetting {
  constructor(title, body, title_regex, body_regex) {
    this.title = title;
    this.body = body;
    this.title_regex = title_regex;
    this.body_regex = body_regex;
  }
}

/**
 * A `Gtk.Grid` displaying the controls to create a `FilterSetting`.
 *
 * @param {Widget} parent
 * @param {Function} removeCallback
 * @param {Function} saveCallback
 */
export var FilterSettingComponent = class FilterSettingComponent {

  /**
   * Constructor with savedSetting initialized.
   *
   * @param {Widget} parent
   * @param {Function} removeCallback
   * @param {Function} saveCallback
   * @param {Function} savedSetting
   */
   constructor(parent, removeCallback, saveCallback, savedSetting=undefined) {
    this.parent = parent;
    this.removeCallback = removeCallback;
    this.saveCallback = saveCallback;
    this.savedSetting = savedSetting;
    this.id = this.guid();
  }

  /**
   * Create the controls.
   */
  create() {
    this.grid = new Gtk.Grid({
      hexpand: true,
      vexpand: false,
      row_homogeneous: false,
      column_homogeneous: false,
      column_spacing: 12,
      row_spacing: 12,
      margin_start: 15,
      margin_top: 10,
      margin_end: 15,
      margin_bottom: 10,
      css_classes: ['bordered', 'padded', 'shadowed', 'lighter'],
    });

    this.parent.append(this.grid);

    // ====================
    //      Title label
    // ====================
    const titleLabel = new Gtk.Label({
      label: 'Title text to match:',
      halign: Gtk.Align.CENTER,
    });
    this.grid.attach(titleLabel, 0, 0, 1, 1);

    // ====================
    //      Title entry
    // ====================
    this.titleEntry = new Gtk.Entry({
      width_chars: 30,
    });
    if (this.savedSetting && this.savedSetting.title) {
      this.titleEntry.text = this.savedSetting.title;
    }
    // .attach param order: col, row, width, height
    this.grid.attach(this.titleEntry, 1, 0, 1, 1);
    this.titleEntry.connect('changed', () => {
      this.createFilterSetting();
      this.saveCallback();
    });

    // ===========================
    //     Title Regex Checkbox
    // ===========================
    this.titleRegexButton = Gtk.CheckButton.new_with_label('Use regex');
    this.titleRegexButton.tooltip_text = 'Use regular expression matching for the title';
    if (this.savedSetting && this.savedSetting.title_regex) {
      this.titleRegexButton.active = this.savedSetting.title_regex;
    }
    this.grid.attach(this.titleRegexButton, 2, 0, 1, 1);
    this.titleRegexButton.connect('toggled', () => {
      this.createFilterSetting();
      this.saveCallback();
    });

    // ====================
    //      Body label
    // ====================
    const bodyLabel = new Gtk.Label({
      label: 'Body text to match:',
      halign: Gtk.Align.END,
    });
    this.grid.attach(bodyLabel, 0, 1, 1, 1);

    // ====================
    //      Body entry
    // ====================
    this.bodyEntry = new Gtk.Entry({
      width_chars: 30,
    });
    if (this.savedSetting && this.savedSetting.body) {
      this.bodyEntry.text = this.savedSetting.body;
    }
    this.grid.attach(this.bodyEntry, 1, 1, 1, 1);
    this.bodyEntry.connect('changed', () => {
      this.createFilterSetting();
      this.saveCallback();
    });

    // ===========================
    //     Body Regex Checkbox
    // ===========================
    this.bodyRegexButton = Gtk.CheckButton.new_with_label('Use regex');
    this.bodyRegexButton.tooltip_text = 'Use regular expression matching for the body';
    if (this.savedSetting && this.savedSetting.body_regex) {
      this.bodyRegexButton.active = this.savedSetting.body_regex;
    }
    this.grid.attach(this.bodyRegexButton, 2, 1, 1, 1);
    this.bodyRegexButton.connect('toggled', () => {
      this.createFilterSetting();
      this.saveCallback();
    });

    // ====================
    //     Delete button
    // ====================
    const deleteButton = Gtk.Button.new_with_label('Delete');
    deleteButton.halign = Gtk.Align.CENTER;
    deleteButton.tooltip_text = 'Delete this filter';
    deleteButton.connect('clicked', () => { this.removeCallback(this); });
    this.grid.attach(deleteButton, 1, 2, 2, 1);

    this.createFilterSetting();
  }

  createFilterSetting() {
    this.setting = new FilterSetting(
      this.titleEntry.text,
      this.bodyEntry.text,
      this.titleRegexButton.active,
      this.bodyRegexButton.active
    );
  }

  guid() {
    const buffer = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 16; i++) {
      buffer[i] = chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return buffer.join('');
  }

  /**
   * Get the root widget.
   *
   * @returns Gtk.Grid
   */
  getGrid() {
    return this.grid;
  }

  /**
   * Get the settings specified in this panel's controls.
   *
   * @returns FilterSetting
   */
  getSetting() {
    return this.setting;
  }

  /**
   * Set a `FilterSetting` for use in initializing controls.
   *
   * @param {FilterSetting} savedSetting
   */
  setSetting(savedSetting) {
      this.savedSetting = savedSetting;
  }

  getId() {
    return this.id;
  }
}
