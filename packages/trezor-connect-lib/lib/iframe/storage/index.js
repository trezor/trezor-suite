'use strict';

exports.__esModule = true;
exports.load = exports.save = exports.CONFIRMATION_KEY = exports.PERMISSIONS_KEY = void 0;
var PERMISSIONS_KEY = 'trezorconnect_permissions';
exports.PERMISSIONS_KEY = PERMISSIONS_KEY;
var CONFIRMATION_KEY = 'trezorconnect_confirmations';
exports.CONFIRMATION_KEY = CONFIRMATION_KEY;
var _storage = {};

var save = function save(storageKey, value, temporary) {
  if (temporary === void 0) {
    temporary = false;
  }

  if (temporary) {
    _storage[storageKey] = JSON.stringify(value);
    return;
  }

  try {
    window.localStorage[storageKey] = JSON.stringify(value);
    return;
  } catch (ignore) {} // empty
  // Fallback cookie


  try {
    window.document.cookie = encodeURIComponent(storageKey) + '=' + JSON.stringify(value) + ';';
  } catch (ignore) {// empty
  }
};

exports.save = save;

var load = function load(storageKey, temporary) {
  if (temporary === void 0) {
    temporary = false;
  }

  var value;

  if (temporary) {
    value = _storage[storageKey];
    return value ? JSON.parse(value) : null;
  }

  try {
    value = window.localStorage[storageKey];
  } catch (ignore) {} // empty
  // Fallback cookie if local storage gives us nothing


  if (typeof value === 'undefined') {
    try {
      var cookie = window.document.cookie;
      var location = cookie.indexOf(encodeURIComponent(storageKey) + '=');

      if (location !== -1) {
        var matches = /^([^;]+)/.exec(cookie.slice(location));

        if (matches) {
          value = matches[1];
        }
      }
    } catch (ignore) {// empty
    }
  }

  return value ? JSON.parse(value) : null;
};

exports.load = load;