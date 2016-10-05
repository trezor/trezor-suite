# trezor-link

[![Build Status](https://travis-ci.org/trezor/trezor-link.svg?branch=master)](https://travis-ci.org/trezor/trezor-link) [![gitter](https://badges.gitter.im/trezor/community.svg)](https://gitter.im/trezor/community)

Library for low-level communication with TREZOR.

Intended as a "building block" for other packages - it is used in trezor.js and chrome extension.

*You probably don't want to use this package directly.* For communication with Trezor with a more high-level API, use [trezor.js](https://www.npmjs.com/package/trezor.js).

## Packages

We have three different npm packages for different usecases, unfortunately.

* `require('trezor-link')` for browser
* `require('trezor-link-node')` for node.js (and electron apps)
* `require('trezor-link-browser-extension')` for browser extensions

## How to use

Use like this (in node):

```javascript
var Link = require('trezor-link-node');
var LowlevelTransport = Link.Lowlevel;
var NodeHidPlugin = Link.NodeHid;

var link = new LowlevelTransport(new NodeHidPlugin());

// for simple config load; you can also load by file API from a disk without node-fetch
var fetch = require('node-fetch');

var config = fetch('https://wallet.mytrezor.com/data/config_signed.bin').then(function (response) {
  if (response.ok) {
    return response.text();
  } else {
    throw new Error(`Fetch error ${response.status}`);
  }
});

return link.init().then(function () { 
  return config.then(function (configData) {
    return link.configure(configData);
  });
}).then(function () {
  return link.enumerate();
}).then(function (devices) {
  return link.acquire(devices[0].path);
}).then(function (session) {
  return link.call(session, 'GetFeatures', {}).then(function (features) {
    console.log(features);
    return link.release(session);
  });
}).catch(function (error) {
  console.error(error);
});

```

## Notes

Source is annotated with Flow types, so it's more obvious what is going on from source code.

## Flow

If you want to use flow for typechecking, just include the file as normally, it will automatically use the included flow file. However, you need to add `flowtype/*.js` to your `[libs]` (or copy it yourself from flow-typed repository), and probably libs from flowconfig.

## License

LGPLv3

* (C) 2015 Karel Bilek (SatoshiLabs) <kb@karelbilek.com>
* (C) 2014 Mike Tsao <mike@sowbug.com>
* (C) 2014 Liz Fong-Jones <lizf@google.com>
* (C) 2015 William Wolf <throughnothing@gmail.com>

