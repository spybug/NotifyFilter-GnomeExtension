'use strict';

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const settings = ExtensionUtils.getSettings(
  'org.gnome.shell.extensions.notification-filter'
);
const Me = ExtensionUtils.getCurrentExtension();
const FilterSettingComponent = Me.imports.common.FilterSettingComponent;
const MAX_FILTERS = 100;

var filterRows = [];
var filtersParentBox;
var addButton;


/**
 * A panel of widgets to specify the settings for filters to apply.
 *
 * @param {FilterSetting[]} savedSettings
 */
var SettingsEditor = class SettingsEditor {
  /**
   * Constructor.
   *
   * @param {FilterSetting[]} savedSettings
   */
  constructor(savedSettings) {
    this.savedSettings = savedSettings;
    filterRows = [];
  }

  /**
   * Build the widgets.
   */
  create() {
    this.mainBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 10,
      css_classes: ['padded'],
      homogeneous: false,
    });

    const helpLabel = new Gtk.Label({
      label: 'Specify filters below to prevent new notifications from appearing if they match the text specified.\n\nIf both the title and body are specified for a filter, they both have to match for the filter to be applied. For each title and body filter, you can use regex matching instead of plain text matching if preferred.',
      halign: Gtk.Align.CENTER,
      wrap: true,
    });
    this.mainBox.append(helpLabel);

    // Scrolling container for all filter rows.
    const scroller = new Gtk.ScrolledWindow({
      min_content_width: 800,
      min_content_height: 350,
      css_classes: ['bordered', 'lighter'],
    });
    this.mainBox.append(scroller);

    filtersParentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      vexpand: true,
      homogeneous: false,
    });
    scroller.set_child(filtersParentBox);

    // Add a filter row to scroller for each entry in savedSettings
    for (let i = 0; i < this.savedSettings.length; i++) {
      const setting = this.savedSettings[i];
      const newFilterRow = new FilterSettingComponent(
        filtersParentBox,
        removeFilterRow,
        save,
        setting
      );
      newFilterRow.create();
      filterRows.push(newFilterRow);
    }

    // Add new filter button
    addButton = Gtk.Button.new_with_label('Add new filter');
    if (filterRows.length > MAX_FILTERS) {
      addButton.set_label('Reached max filters, please delete some first');
    }
    ;
    addButton.tooltip_text = 'Add a new filter setting row';
    addButton.connect('clicked', function () {
      if (filterRows.length > MAX_FILTERS) {
        addButton.set_label('Reached max filters, please delete some first');
        return;
      }
      const newFilterRow = new FilterSettingComponent(filtersParentBox, removeFilterRow, save);
      newFilterRow.create();
      filterRows.push(newFilterRow);
      save();
    });
    this.mainBox.append(addButton);
  }

  /**
   * Get the base widget.
   *
   * @returns Gtk.Box
   */
  getWidget() {
    return this.mainBox;
  }
};

/**
 * Remove the received `FilterSettingComponent` from list whose settings are
 * saved as preferences, and remove the `Gtk.Grid` widget from display.
 *
 * @param {FilterSettingComponent} filterRow
 */
var removeFilterRow = function (filterRow) {
  for (let i = 0; i < filterRows.length; i++) {
    if (filterRows[i].getId() === filterRow.getId()) {
      // remove from js array
      filterRows.splice(i, 1);
      // remove widget
      filtersParentBox.remove(filterRow.getGrid());
      if (filterRows.length <= MAX_FILTERS) {
        addButton.set_label('Add new filter');
      }
      break;
    }
  }
  save();
};

/**
 * Save the settings from all the filter rows in the UI.
 */
var save = function () {
  const settingsToSave = [];
  for (let i = 0; i < filterRows.length; i++) {
    const setting = filterRows[i].getSetting();
    // convert non-string property values to strings
    setting.title_regex = setting.title_regex.toString();
    setting.body_regex = setting.body_regex.toString();
    settingsToSave.push(setting);
  }
  if (settingsToSave.length == 0) {
    settings.reset('filters');
    Gio.Settings.sync();
  } else {
    settings.set_value('filters', new GLib.Variant('aa{ss}', settingsToSave));
    Gio.Settings.sync();
  }
};
