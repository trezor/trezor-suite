'use strict'; // slight hack to make Flow happy, but to allow Node to set its own fetch
// Request, RequestOptions and Response are built-in types of Flow for fetch API

exports.__esModule = true;
exports.setFetch = setFetch;
exports.udevInstallers = udevInstallers;
exports.latestVersion = latestVersion;
exports.installers = installers;

var _fetch = typeof window === 'undefined' ? function () {
  return Promise.reject();
} : window.fetch;

function setFetch(fetch) {
  _fetch = fetch;
}

function fillInstallerUrl(installer, domain) {
  return {
    url: domain + installer.shortUrl,
    label: installer.label,
    platform: installer.platform
  };
}

var DATA_DOMAIN = 'https://mytrezor.s3.amazonaws.com';
var BRIDGE_VERSION_URL = DATA_DOMAIN + '/bridge/latest.txt';
var BRIDGE_INSTALLERS = [{
  shortUrl: '/bridge/%version%/trezor-bridge-%version%-win32-install.exe',
  label: 'Windows',
  platform: ['win32', 'win64']
}, {
  shortUrl: '/bridge/%version%/trezor-bridge-%version%.pkg',
  label: 'Mac OS X',
  platform: 'mac'
}, {
  shortUrl: '/bridge/%version%/trezor-bridge_%version%_amd64.deb',
  label: 'Linux 64-bit (deb)',
  platform: 'deb64'
}, {
  shortUrl: '/bridge/%version%/trezor-bridge-%version%-1.x86_64.rpm',
  label: 'Linux 64-bit (rpm)',
  platform: 'rpm64'
}, {
  shortUrl: '/bridge/%version%/trezor-bridge_%version%_i386.deb',
  label: 'Linux 32-bit (deb)',
  platform: 'deb32'
}, {
  shortUrl: '/bridge/%version%/trezor-bridge-%version%-1.i386.rpm',
  label: 'Linux 32-bit (rpm)',
  platform: 'rpm32'
}];
var UDEV_INSTALLERS = [{
  shortUrl: '/udev/trezor-udev-1-1.noarch.rpm',
  label: 'RPM package',
  platform: ['rpm32', 'rpm64']
}, {
  shortUrl: '/udev/trezor-udev_1_all.deb',
  label: 'DEB package',
  platform: ['deb32', 'deb64']
}];

function udevInstallers(options) {
  var o = options || {};
  var platform = o.platform || preferredPlatform();
  var domain = o.domain || DATA_DOMAIN;
  return UDEV_INSTALLERS.map(function (i) {
    return fillInstallerUrl(i, domain);
  }).map(function (udev) {
    return {
      url: udev.url,
      label: udev.label,
      platform: udev.platform,
      preferred: isPreferred(udev.platform, platform)
    };
  });
}

function latestVersion(options) {
  var o = options || {};
  var bridgeUrl = o.bridgeUrl || BRIDGE_VERSION_URL;
  return _fetch(bridgeUrl).then(function (response) {
    return response.ok ? response.text() : response.text().then(function (text) {
      return Promise.reject(text);
    });
  }).then(function (version_) {
    if (typeof version_ !== 'string') {
      throw new Error('Wrong version load result.');
    }

    return version_.trim();
  });
}

// Returns a list of bridge installers, with download URLs and a mark on
// bridge preferred for the user's platform.
function installers(options) {
  var o = options || {};
  var version = Promise.resolve(o.version || latestVersion(options));
  return version.then(function (version) {
    var platform = o.platform || preferredPlatform();
    var domain = o.domain || DATA_DOMAIN;
    return BRIDGE_INSTALLERS.map(function (i) {
      return fillInstallerUrl(i, domain);
    }).map(function (bridge) {
      return {
        version: version,
        url: bridge.url.replace(/%version%/g, version),
        label: bridge.label,
        platform: bridge.platform,
        preferred: isPreferred(bridge.platform, platform)
      };
    });
  });
}

function isPreferred(installer, platform) {
  if (typeof installer === 'string') {
    // single platform
    return installer === platform;
  } else {
    // any of multiple platforms
    for (var i = 0; i < installer.length; i++) {
      if (installer[i] === platform) {
        return true;
      }
    }

    return false;
  }
}

function preferredPlatform() {
  var ver = navigator.userAgent;
  if (ver.match(/Win64|WOW64/)) return 'win64';
  if (ver.match(/Win/)) return 'win32';
  if (ver.match(/Mac/)) return 'mac';

  if (ver.match(/Linux i[3456]86/)) {
    return ver.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/) ? 'rpm32' : 'deb32';
  }

  if (ver.match(/Linux/)) {
    return ver.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/) ? 'rpm64' : 'deb64';
  } // fallback - weird OS
  // most likely windows, let's say 32 bit


  return 'win32';
}