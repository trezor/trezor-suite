'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.parseBridgeJSON = exports.checkBrowser = exports.state = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var bowser = _interopRequireWildcard(require("bowser"));

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var state = {
  name: 'unknown',
  osname: 'unknown',
  supported: false,
  outdated: false,
  mobile: false
};
exports.state = state;

var checkBrowser = function checkBrowser() {
  if (typeof window === 'undefined') {
    state.name = 'nodejs';
    state.supported = true;
    return state;
  }

  var supported = _DataManager.default.getConfig().supportedBrowsers;

  state.name = bowser.name + ": " + bowser.version + "; " + bowser.osname + ": " + bowser.osversion + ";";
  state.mobile = bowser.mobile;
  state.osname = bowser.osname;

  if (bowser.mobile && typeof navigator.usb === 'undefined') {
    state.supported = false;
  } else {
    var isSupported = supported[bowser.name.toLowerCase()];

    if (isSupported) {
      state.supported = true;
      state.outdated = isSupported.version > parseInt(bowser.version, 10);
    }
  }

  return state;
}; // Parse JSON loaded from config.assets.bridge
// Find preferred platform using bowser and userAgent


exports.checkBrowser = checkBrowser;

var parseBridgeJSON = function parseBridgeJSON(json) {
  var osname = bowser.osname ? bowser.osname.toLowerCase() : 'default';
  var preferred = '';

  switch (osname) {
    case 'linux':
      {
        var agent = navigator.userAgent;
        var isRpm = agent.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/) ? 'rpm' : 'deb';
        var is64x = agent.match(/Linux i[3456]86/) ? '32' : '64';
        preferred = "" + isRpm + is64x;
      }
      break;

    case 'macos':
      preferred = 'mac';
      break;

    case 'windows':
      preferred = 'win';
      break;

    default:
      break;
  } // $FlowIssue indexer property is missing in `JSON`


  var latest = json[0];
  var version = latest.version.join('.');
  latest.packages = latest.packages.map(function (p) {
    return (0, _objectSpread2.default)({}, p, {
      url: "" + latest.directory + p.url,
      signature: p.signature ? "" + latest.directory + p.signature : null,
      preferred: p.platform.indexOf(preferred) >= 0
    });
  });
  latest.changelog = latest.changelog.replace(/\n/g, '').split('* ');
  latest.changelog.splice(0, 1);
  return JSON.parse(JSON.stringify(latest).replace(/{version}/g, version));
};

exports.parseBridgeJSON = parseBridgeJSON;