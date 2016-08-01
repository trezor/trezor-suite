Trezor-link
====

A library for communication with TREZOR via various means.

Trezor-link only works on a "low level"; it only sends messages to TREZOR and receives messages back, and parses them from and to JSON.

For more "high-level" access, you should use trezor.js. 

The long-term plan is to merge trezor.js and trezor-link, so that we don't have two distinct libraries. But so far, we have trezor-link for "low-level" access and trezor.js for "high level" access.

trezor-link uses plugins for various transports. So far, we have two transports - one for communicating via Chrome HID API in extensions, and one for communicating via node-hid in Node.js environment (for use in Electron apps, or regular node apps).

How to use
-----

Use like this (in node):

```javascript
var Link = require('trezor-link');
var nodeTransport = require('trezor-link-node-hid'); // in npm

// for simple config load; you can also load by file API from a disk without node-fetch
var fetch = require('node-fetch');

var config = fetch('https://wallet.mytrezor.com/data/config_signed.bin').then(function (response) {
  if (response.ok) {
    return response.text();
  } else {
    throw new Error(`Fetch error ${response.status}`);
  }
});

var link = new Link(hidTransport);
config.then(function (configData) {
  return link.configure(configData);
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

Similarly with chrome and its module; no need to use node-fetch replacement in Chrome though, since it's built-in there.

Flow
----
If you want to use flow for typechecking, just include the file as normally, it will automatically use the included flow file. However, you need to add flowtype/bitcoinjs-libs.js to your `[libs]` (or copy it yourself from flow-typed repository), and probably other libs from 

I myself recommend 100% using Flow, but it can be a pain to set up, so it's on you.

License
----
LGPLv3

* (C) 2015 Karel Bilek (SatoshiLabs) <kb@karelbilek.com>
* (C) 2014 Mike Tsao <mike@sowbug.com>
* (C) 2014 Liz Fong-Jones <lizf@google.com>
* (C) 2015 William Wolf <throughnothing@gmail.com>

