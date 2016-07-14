/* @flow */

"use strict";

import {Handler} from './handler';
import {mockTransport} from './transports/mock';

const handler = new Handler(mockTransport);

/*
 browserify
fetch('./config_signed.bin').then(res => {
  return res.text();
}).then(res => {
  handler.configure(res).then(
    () => {
      console.log("yay");
    },
    (e) => {
      console.error(e);
    }
  );
});
console.log(`fuck`);
*/

const fs = require(`fs`);
fs.readFile(`../dist/config_signed.bin`, `utf8`, function (err, data) {
  if (err) {
    return console.log(err);
  }

  handler.configure(data).then(
    () => {
      console.log(handler._messages);
    },
    (e) => {
      console.error(e);
    }
  );
});
