/* @flow */

declare var __VERSION__: string;

import {debugInOut} from '../debug-decorator';

type TrezorDeviceInfo = {path: string};

const TREZOR_DESCS = [{
  vendorId: 0x534c,
  productId: 0x0001,
}, {
  vendorId: 0x1209,
  productId: 0x53c1,
}];

export default class WebUsbPlugin {
  name: string = `WebUsbPlugin`;

  version: string = __VERSION__;
  debug: boolean = false;

  usb: USB;

  allowsWriteAndEnumerate: boolean = true;

  devices: {[path: string]: {
    device: USBDevice;
    requested: boolean;
  }} = {};
  lastPath: number = 0;

  @debugInOut
  init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    try {
      // $FlowIssue
      const usb = navigator.usb;
      if (usb == null) {
        return Promise.reject(new Error(`WebUSB is not available on this browser.`));
      } else {
        this.usb = usb;
        return Promise.resolve();
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  enumerate(): Promise<Array<TrezorDeviceInfo>> {
    return this.usb.getDevices().then(devices => {
      const res: Array<TrezorDeviceInfo> = [];
      devices.forEach((dev, i) => {
        const isTrezor = TREZOR_DESCS.some(desc =>
          dev.vendorId === desc.vendorId && dev.productId === desc.productId
        );
        if (isTrezor) {
          let isPresent = false;
          let path: string = ``;
          let canGrab = false;
          Object.keys(this.devices).forEach(kpath => {
            if (this.devices[kpath].device === dev) {
              isPresent = true;
              path = kpath;
              canGrab = this.devices[kpath].requested;
            }
          });
          if (!isPresent) {
            this.lastPath++;
            this.devices[this.lastPath.toString()] = {device: dev, requested: false};
            path = this.lastPath.toString();
            canGrab = false;
          }
          res.push({path, canGrab});
        }
      });
      Object.keys(this.devices).forEach(kpath => {
        const isPresent = devices.some(device => this.devices[kpath].device === device);
        if (!isPresent) {
          delete this.devices[kpath];
        }
      });
      return res;
    });
  }

  send(path: string, session: string, data: ArrayBuffer): Promise<void> {
    const device = this.devices[path];
    if (device == null) {
      return Promise.reject(new Error(`Device not found`));
    }

    const uDevice: USBDevice = device.device;

    const newArray: Uint8Array = new Uint8Array(64);
    newArray[0] = 63;
    newArray.set(new Uint8Array(data), 1);

    return uDevice.transferOut(2, data).then(() => {});
  }

  receive(path: string, session: string): Promise<ArrayBuffer> {
    const device = this.devices[path];
    if (device == null) {
      return Promise.reject(new Error(`Device not found`));
    }

    const uDevice: USBDevice = device.device;

    return uDevice.transferIn(2, 64).then(result => {
      return result.data.buffer;
    });
  }

  request(path: string): Promise<USBDevice> {
    return this.usb.requestDevice({filters: TREZOR_DESCS}).then(device => {
      // idiotic thing - the requested path should match the path in this.devices
      // but I cannot really say what the user selected!
      // So I fake it by changing the order in this.devices
      Object.keys(this.devices).forEach(kpath => {
        if (this.devices[kpath].device === device) {
          if (kpath !== path) {
            const sw = this.devices[path];
            this.devices[path] = {device: device, requested: true};
            this.devices[kpath] = sw;
          } else {
            this.devices[path].requested = true;
          }
        }
      });
      return device;
    });
  }

  @debugInOut
  connect(path: string): Promise<string> {
    const preReqDevice = this.devices[path];
    if (preReqDevice == null) {
      return Promise.reject(new Error(`Device not present.`));
    }

    const deviceP: Promise<USBDevice> = preReqDevice.requested
      ? Promise.resolve(preReqDevice.device)
      : this.request(path);

    return deviceP.then(device => {
      return device.open().then(() => {
        return device.reset();
      }).then(() => {
        return device.selectConfiguration(1);
      }).then(() => {
        return device.claimInterface(2);
      });
    }).then(() => path); // path == session, why not?
  }

  @debugInOut
  disconnect(path: string, session: string): Promise<void> {
    const device = this.devices[path];
    if (device == null) {
      return Promise.reject(new Error(`Device not present.`));
    }

    return device.device.releaseInterface(2).then(() => {
      return device.device.close();
    });
  }
}
