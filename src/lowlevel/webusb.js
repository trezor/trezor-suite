/* @flow */

type ChannelData = {
    serialNumber: ?string;
    session: ?string;
};

declare class BroadcastChannel {
  constructor(name: string): void;
  onmessage: ?((event: {data: ChannelData}) => void);
  postMessage: (data: ChannelData) => void;
}

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

  devices: {[path: string]:
    {
      device: USBDevice;
      session: ?string;
    }
  } = {};
  lastPath: number = 0;
  lastSession: number = 0;

  channel: BroadcastChannel;

  onChannelMessage(obj: ChannelData) {
    this.lock(() => {
      if (obj.session != null) {
        this.lastSession = parseInt(obj.session);
      }
      Object.keys(this.devices).forEach(k => {
        const d = this.devices[k];
        if (
          (obj.serialNumber == null && d.device.serialNumber == null) ||
          (d.device.serialNumber === obj.serialNumber)
        ) {
          d.session = obj.session;
        }
      });
      return Promise.resolve();
    });
  }

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

        this.channel = new BroadcastChannel(`trezor_webusb_sessions`);
        this.channel.onmessage = (event) => { this.onChannelMessage(event.data); };

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
          Object.keys(this.devices).forEach(kpath => {
            if (this.devices[kpath].device === dev) {
              isPresent = true;
              path = kpath;
            }
          });
          if (!isPresent) {
            this.lastPath++;
            this.devices[this.lastPath.toString()] = {device: dev, session: null};
            path = this.lastPath.toString();
          }
          res.push({path});
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

    return uDevice.transferOut(2, newArray).then(() => {});
  }

  receive(path: string, session: string): Promise<ArrayBuffer> {
    const device = this.devices[path];
    if (device == null) {
      return Promise.reject(new Error(`Device not found`));
    }

    const uDevice: USBDevice = device.device;

    return uDevice.transferIn(2, 64).then(result => {
      return result.data.buffer.slice(1);
    });
  }

  @debugInOut
  connect(path: string, previous: ?string): Promise<string> {
    return this.lock(() => {
      const device = this.devices[path];
      if (device == null) {
        return Promise.reject(new Error(`Device not present.`));
      }

      return device.device.open().then(() => {
        return device.device.selectConfiguration(1);
      }).then(() => {
        if (previous != null) {
          return device.device.reset();
        }
      }).then(() => {
        return device.device.claimInterface(2).catch((e) => {
          if (typeof e === `object`) {
            if (e.code) {
              if (e.code === 19 && previous == null) {
                throw new Error(`wrong previous session`);
              }
            }
          }
          throw e;
        });
      }).then(() => {
        this.lastSession++;
        const newSession = this.lastSession.toString();
        device.session = newSession;
        this.channel.postMessage({serialNumber: device.device.serialNumber, session: device.session});
        return newSession;
      }); // path == session, why not?
    });
  }

  @debugInOut
  disconnect(path: string, session: string): Promise<void> {
    return this.lock(() => {
      const device = this.devices[path];
      if (device == null) {
        return Promise.reject(new Error(`Device not present.`));
      }

      return device.device.releaseInterface(2).then(() => {
        return device.device.close();
      }).then(() => {
        device.session = null;
        this.channel.postMessage({serialNumber: device.device.serialNumber, session: null});
        return;
      });
    });
  }

  requestDevice(): Promise<void> {
    // I am throwing away the resulting device, since it appears in enumeration anyway
    return this.usb.requestDevice({filters: TREZOR_DESCS}).then(() => {});
  }

  requestNeeded: boolean = true;

  _lock: Promise<any> = Promise.resolve();
  lock<X>(fn: () => (Promise<X>)): Promise<X> {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }
}
