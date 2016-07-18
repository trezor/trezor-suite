

"use strict";

var _handler = require('./handler');

var _node = require('./transports/node');

const handler = new _handler.Handler(_node.nodeTransport);
const fs = require('fs');

function readConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile(`../dist/config_signed.bin`, `utf8`, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

readConfig().then(res => {
  console.log("res");
  return handler.configure(res).then(() => {
    return handler.enumerate().then(enres => {
      console.log("got");
      return handler.acquire(enres[0].path).then(session => {
        console.log("acquired");
        return handler.call(session, `GetFeatures`, {}).then(features => {
          console.log(features);
          return handler.release(session);
        });
      });
    });
  });
}).catch(e => console.error(e));

console.log("konec");

/* chrome

fetch('./config_signed.bin').then(res => {
  return res.text();
}).then(res => {
  handler.configure(res).then(
    () => {
      handler.enumerate().then(enres => {
        handler.acquire(enres[0].path).then(session => {
          handler.call(session, "GetFeatures", {}).then(features => {
            console.log(features);
          });
        });
      });
    },
    (e) => {
      console.error(e);
    }
  );
});

*/