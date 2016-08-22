Trezor-link
====

*DO NOT USE THIS YET - IT IS STILL IN DEVELOPMENT AND THE API IS CHANGING RAPIDLY*

Library for low-level communication with TREZOR.

Intended as a "building block" for other packages - it is used in trezor.js and chrome extension.

*You probably don't want to use this package directly.* For communicating with Trezor with a more high-level API, use trezor.js (TODO).

How to use
-----

Use like this (in node):

```javascript
var LowlevelTransport = require('trezor-link/lib/lowlevel');
var NodeHidPlugin = require('trezor-link/lib/lowlevel/node-hid')

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

We have several transports.

* `trezor-link/lib/bridge` uses bridge
* `trezor-link/lib/extension` uses official TREZOR Chrome Extension by contacting it
* `trezor-link/lib/parallel` allows you to use more transports at the same time
  * useful when you have different classes of device - for example, virtual UDP simulator *and* actual device
  * `ParallelTransport` creates a new transport that acts like a normal transport from outside
* `trezor-link/lib/fallback` tries to init multiple transports and uses the first one
* `trezor-link/lib/lowlevel` creates a low-level transport that "actually" talks to the device; you need to select one of the plug-ins
  * `trezor-link/lib/lowlevel/chrome-hid` is a plug-in for HID API inside Chrome App environment (note: you should try to use `trezor-link/lib/extension` first)
  * `trezor-link/lib/lowlevel/chrome-udp` is for a virtual simulator (internal SatoshiLabs tool, not yet released),which is connected via UDP inside Chrome App environment
  * `trezor-link/lib/lowlevel/node-hid` is for HID API inside Node environment


Notes
---
We are transpiling to JS that runs on chrome >= 49 and node >= 5, since it doesn't run anywhere else anyway and there is no need to transpile to the other environments. If you have a reason why to transpile to anything else (older node / other browser), just write a github issue!

Source is annotated with Flow types, so it's more obvious what is going on from source code.

We use `node-hid` as a dependency, but it's only used in node environment and it's compiled from C++, which might cause some issues down the line. Ping us if it's a problem.

Flow
----
If you want to use flow for typechecking, just include the file as normally, it will automatically use the included flow file. However, you need to add `flowtype/*.js` to your `[libs]` (or copy it yourself from flow-typed repository), and probably libs from flowconfig.


License
----
LGPLv3

* (C) 2015 Karel Bilek (SatoshiLabs) <kb@karelbilek.com>
* (C) 2014 Mike Tsao <mike@sowbug.com>
* (C) 2014 Liz Fong-Jones <lizf@google.com>
* (C) 2015 William Wolf <throughnothing@gmail.com>

