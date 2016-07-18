

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const HID = require('node-hid');

const REPORT_ID = 63;

const TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001
};

class NodeTransport {
  constructor() {
    this._sessionCounter = 0;
    this._devices = {};
  }

  // path => device


  enumerate() {
    const devices = HID.devices().filter(d => d.vendorId === TREZOR_DESC.vendorId && d.productId === TREZOR_DESC.productId).map(device => {
      const path = device.path;
      return {
        path: path
      };
    });
    return Promise.resolve(devices);
  }

  send(path, session, data) {
    const device = this._devices[path];
    const toWrite = [REPORT_ID].concat(Array.from(new Uint8Array(data)));
    try {
      device.write(toWrite);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  receive(path, session) {
    const device = this._devices[path];
    return new Promise((resolve, reject) => {
      console.log("receiving");
      let onData = data => {};
      const onError = error => {
        console.log("on error yay");
        reject(error);
        device.removeListener(`data`, onData);
      };
      onData = data => {
        console.log("on data yay", data);
        // flow
        if (!(data instanceof Error)) {
          device.pause();
          device.removeListener(`error`, onError);
          resolve(nodeBuffer2arrayBuffer(data.slice(1)));
        }
      };
      device.once(`data`, onData);
      device.once(`error`, onError);
      device.resume();
    });
  }

  connect(path) {
    const counter = this._sessionCounter;
    this._sessionCounter++;
    try {
      const device = new HID.HID(path);
      this._devices[path] = device;
      device.pause();
      return Promise.resolve(counter.toString());
    } catch (e) {
      return Promise.reject(e);
    }
  }

  disconnect(path, session) {
    try {
      const device = this._devices[path];
      device.close();
      delete this._devices[path];
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

exports.NodeTransport = NodeTransport;
function nodeBuffer2arrayBuffer(b) {
  return new Uint8Array(b).buffer;
}

const nodeTransport = exports.nodeTransport = new NodeTransport();