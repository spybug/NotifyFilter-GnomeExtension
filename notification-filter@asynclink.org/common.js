'use strict';

export const MAX_FILTERS = 100;

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
  // Pad out the rest of the array to MAX_FILTERS length.
  for (let i = unpackedSettings.length; i < MAX_FILTERS; i++) {
    loadedSettings.push(new FilterSetting('', '', '', ''));
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
export var FilterSetting = class FilterSetting {
  constructor(title, body, title_regex, body_regex) {
    this.title = title;
    this.body = body;
    this.title_regex = title_regex;
    this.body_regex = body_regex;
  }
}
