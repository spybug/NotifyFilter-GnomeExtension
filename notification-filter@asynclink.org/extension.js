'use strict';

import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
//import {NotificationDestroyedReason} from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as common from './common.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

let filterSettings;
let settings;
let settingsConnectId;

export default class NotificationFilter extends Extension {
    enable() {
        filterSettings = [];
        settings = Extension.lookupByURL(import.meta.url).getSettings();
        settingsConnectId = settings.connect('changed', () => {
        readSettings();
        });
        readSettings();

        // Override the _updateState() function in MessageTray.
        MessageTray.MessageTray.prototype._updateStateOriginal =
        MessageTray.MessageTray.prototype._updateState;
        MessageTray.MessageTray.prototype._updateState = customUpdateState;
    }

    disable() {
      settings.disconnect(settingsConnectId);
      settings = null;
      filterSettings = null;
      settingsConnectId = null;


      // Revert to original updateState function.
      MessageTray.MessageTray.prototype._updateState =
        MessageTray.MessageTray.prototype._updateStateOriginal;
      delete MessageTray.MessageTray.prototype._updateStateOriginal;
    }
}

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
      //notification.destroy(NotificationDestroyedReason.DISMISSED);
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
