'use strict';

import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as Common from './common.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// The filter rules need to be available in the global scope.
var filterSettings;

export default class NotificationFilter extends Extension {
  // Setup variables.
  settings = null;
  settingsConnectId = null;

  /**
   * Function run when the extension is enabled.
   */
  enable() {
    // Flush the current settings and then load them.
    filterSettings = [];
    this.settings = this.getSettings();
    this.settingsConnectId = this.settings.connect('changed', () => { this.readSettings(); });
    this.readSettings();

    // Override the _updateState() function in MessageTray.
    MessageTray.MessageTray.prototype._updateStateOriginal =
      MessageTray.MessageTray.prototype._updateState;
    MessageTray.MessageTray.prototype._updateState = customUpdateState;
  }

  /**
   * Function that is run when the extension is disabled.
   */
  disable() {
    // Flush out variables.
    this.settings.disconnect(this.settingsConnectId);
    this.settings = null;
    this.settingsConnectId = null;
    filterSettings = null;

    // Revert to original updateState function.
    MessageTray.MessageTray.prototype._updateState =
      MessageTray.MessageTray.prototype._updateStateOriginal;
    delete MessageTray.MessageTray.prototype._updateStateOriginal;
  }

  /**
   * Reads settings to load in user preferences for notifications to filter out.
   */
  readSettings() {
    if (this.settings) {
      filterSettings = Common.getFiltersFromSettings(this.settings);
    }
  }
}
/**
 * The custom update function to check to see if the current notificaiton should be filtered or not.
 */
let customUpdateState = function() {
  // Setup variables.
  let changed = false;

  // Filter out notification queue based on settings.
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
      notification.destroy(MessageTray.NotificationDestroyedReason.DISMISSED);
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
  // Check to see if regex support is enabled, and if so use it.
  if (use_regex) {
    const regex = new RegExp(filter);
    return regex.test(stringToTest);
  }
  return stringToTest.includes(filter);
}
