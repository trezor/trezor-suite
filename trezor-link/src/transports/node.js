/* @flow */

"use strict";

const HID = require('node-hid');

import type {Transport, TrezorDeviceInfo} from './index.js';
import type {HID as HIDDevice, HIDDeviceDescription} from 'node-hid';

const REPORT_ID = 63;

const TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001,
};

export class NodeTransport {

  _sessionCounter: number = 0;

  // path => device
  _devices: {[path: string]: HIDDevice} = {};

  enumerate(): Promise<Array<TrezorDeviceInfo>> {
    const devices = HID.devices()
    .filter(d => d.vendorId === TREZOR_DESC.vendorId && d.productId === TREZOR_DESC.productId)
    .map((device: HIDDeviceDescription): TrezorDeviceInfo => {
      const path = device.path;
      return {
        path,
      };
    });
    return Promise.resolve(devices);
  }

  send(path: string, session: string, data: ArrayBuffer): Promise<void> {
    const device = this._devices[path];
    const toWrite = [REPORT_ID].concat(Array.from(new Uint8Array(data)));
    try {
      device.write(toWrite);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  receive(path: string, session: string): Promise<ArrayBuffer> {
    const device = this._devices[path];
    return new Promise((resolve, reject) => {
      console.log("receiving");
      let onData = (data) => {};
      const onError = (error) => {
        console.log("on error yay");
        reject(error);
        device.removeListener(`data`, onData);
      };
      onData = (data) => {
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

  connect(path: string): Promise<string> {
    const counter = this._sessionCounter;
    this._sessionCounter++;
    try {
      const device: HIDDevice = new HID.HID(path);
      this._devices[path] = device;
      device.pause();
      return Promise.resolve(counter.toString());
    } catch (e) {
      return Promise.reject(e);
    }
  }

  disconnect(path: string, session: string): Promise<void> {
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

function nodeBuffer2arrayBuffer(b: Buffer): ArrayBuffer {
  return new Uint8Array(b).buffer;
}

export const nodeTransport: Transport = new NodeTransport();
