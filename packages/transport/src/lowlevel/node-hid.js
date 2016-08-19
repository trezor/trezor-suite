/* @flow */

declare var __VERSION__: string;

import * as HID from 'node-hid';

import type {HID as HIDDevice, HIDDeviceDescription} from 'node-hid';

const REPORT_ID = 63;

const TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001,
};

type TrezorDeviceInfo = {path:string};

export default class NodeHidPlugin {

  _sessionCounter: number = 0;

  // path => device
  _devices: {[path: string]: HIDDevice} = {};

  version: string = __VERSION__;

  async init(): Promise<void> {
    // try if it's a Node environment
    if (typeof process === 'object' && process != null && process.toString()  === '[object process]'){
      return;
    }
    HID.devices(); // try to read devices once, to maybe get an error now before it's too late
    throw new Error(`Not a node environment.`);
  }

  async enumerate(): Promise<Array<TrezorDeviceInfo>> {
    const devices = HID.devices()
    .filter(d => d.vendorId === TREZOR_DESC.vendorId && d.productId === TREZOR_DESC.productId)
    .map((device: HIDDeviceDescription): TrezorDeviceInfo => {
      const path = device.path;
      return {
        path,
      };
    });
    return devices;
  }

  async send(path: string, session: string, data: ArrayBuffer): Promise<void> {
    const device = this._devices[path];
    const toWrite = [REPORT_ID].concat(Array.from(new Uint8Array(data)));
    device.write(toWrite);
  }

  receive(path: string, session: string): Promise<ArrayBuffer> {
    const device: HIDDevice = this._devices[path];
    return new Promise((resolve, reject) => {
      device.read((error, data) => {
        if (error != null) {
          reject(error);
        } else {
          if (data == null) {
            reject(new Error(`Data is null`));
          } else {
            resolve(nodeBuffer2arrayBuffer(data));
          }
        }
      });
    });
  }

  async connect(path: string): Promise<string> {
    const counter = this._sessionCounter;
    this._sessionCounter++;
    const device: HIDDevice = new HID.HID(path);
    this._devices[path] = device;
    // I am pausing, since I am not using the EventEmitter API, but the read() API
    device.pause();
    return counter.toString();
  }

  async disconnect(path: string, session: string): Promise<void> {
    const device = this._devices[path];
    device.close();
    delete this._devices[path];
  }
}

function nodeBuffer2arrayBuffer(b: Buffer): ArrayBuffer {
  return new Uint8Array(b).buffer;
}
