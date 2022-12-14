'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const MessageTray = imports.ui.messageTray;
const NotificationDestroyedReason =
  imports.ui.messageTray.NotificationDestroyedReason;
const Main = imports.ui.main;
const common = Me.imports.common;

let filterSettings;
let settings;
let settingsConnectId;

/**
 * Reads settings to load in user preferences for notifications to filter out.
 *
 * @method readSettings
 */
function readSettings() {
  if (settings) {
    filterSettings = common.getFiltersFromSettings(settings);
  }
}

let customUpdateState = function() {
  let changed = false;

  // Filter out notificiation queue based on settings.
  this._notificationQueue = this._notificationQueue.filter((notification) => {
    const notificationTitle = notification.title;
    const notificationBody = notification.bannerBodyText;
    let filterNotification = false;

    // Loop through user specified FilterSettings to see if notification matches any.
    for (const filter of filterSettings) {
      try {
        if (filter.title && filter.body) {
          if (testMatch(notificationTitle, filter.title, filter.title_regex) 
              && testMatch(notificationBody, filter.body, filter.body_regex)) {
            filterNotification = true;
            break;
          }
        } else if (filter.body && testMatch(notificationBody, filter.body, filter.body_regex)) {
          filterNotification = true;
          break;
        } else if (filter.title && testMatch(notificationTitle, filter.title, filter.title_regex)) {
          filterNotification = true;
          break;
        }
      } catch (ex) {
        logError(ex, 'Error while applying notification filter');
      }
    }

    // Return false to filter out (skip) this notification.
    if (filterNotification) {
      notification.destroy(NotificationDestroyedReason.DISMISSED);
      // log('Filtered a notification with Title Text:\n\'' + notificationTitle + '\'\nand Body Text:\n\'' + notificationBody + '\'');
      changed = true;
      return false;
    } else {
      return true;
    }
  });

  if (changed) {
    this.emit('queue-changed');
  }

  // Calls the original _updateState, to handle showing the notifications.
  this._updateStateOriginal();
}



/**
 * Returns whether the given stringToTest contains the filter. If use_regex is true than a Regular Expression is used for the match.
 */
function testMatch(stringToTest, filter, use_regex = false) {
  if (use_regex) {
    const regex = new RegExp(filter);
    return regex.test(stringToTest);
  }
  return stringToTest.includes(filter);
}

function init() {}

function enable() {
  filterSettings = [];
  settings = ExtensionUtils.getSettings(
    'org.gnome.shell.extensions.notification-filter'
  );
  settingsConnectId = settings.connect('changed', () => {
    readSettings();
  });
  readSettings();

  // Override the _updateState() function in MessageTray.
  MessageTray.MessageTray.prototype._updateStateOriginal =
    MessageTray.MessageTray.prototype._updateState;
  MessageTray.MessageTray.prototype._updateState = customUpdateState;
}

/**
 * This function could be called after the extension is uninstalled,
 * disabled GNOME Tweaks, when you log out, or when the screen locks.
 *
 * @method disable
 */
function disable() {
  settings.disconnect(settingsConnectId);
  settings = null;
  filterSettings = null;
  settingsConnectId = null;

  
  // Revert to original updateState function.
  MessageTray.MessageTray.prototype._updateState =
    MessageTray.MessageTray.prototype._updateStateOriginal;
  delete MessageTray.MessageTray.prototype._updateStateOriginal;
}
