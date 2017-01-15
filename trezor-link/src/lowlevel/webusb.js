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

  @debugInOut
  async init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    // $FlowIssue
    const usb = navigator.usb;
    if (usb == null) {
      throw new Error(`WebUSB is not available on this browser.`);
    } else {
      this.usb = usb;
    }
  }

  async _listDevices(): Promise<Array<{path: string, device: USBDevice}>> {
    let bootloaderId = 0;
    const devices = await this.usb.getDevices();
    return devices.filter(dev => {
      const isTrezor = TREZOR_DESCS.some(desc =>
        dev.vendorId === desc.vendorId && dev.productId === desc.productId
      );
      return isTrezor;
    }).map(device => {
      // path is just serial number
      // more bootloaders => number them, hope for the best
      const serialNumber = device.serialNumber;
      let path = (serialNumber == null || serialNumber === ``) ? `bootloader` : serialNumber;
      if (path === `bootloader`) {
        bootloaderId++;
        path = path + bootloaderId;
      }
      return {path, device};
    });
  }

  async enumerate(): Promise<Array<TrezorDeviceInfo>> {
    return (await this._listDevices()).map(info => ({path: info.path}));
  }

  async _findDevice(path: string): Promise<USBDevice> {
    const deviceO = (await this._listDevices()).find(d => d.path === path);
    if (deviceO == null) {
      throw new Error(`Device not present.`);
    }
    return deviceO.device;
  }

  async send(path: string, data: ArrayBuffer): Promise<void> {
    const device: USBDevice = await this._findDevice(path);

    const newArray: Uint8Array = new Uint8Array(64);
    newArray[0] = 63;
    newArray.set(new Uint8Array(data), 1);

    return device.transferOut(2, newArray).then(() => {});
  }

  async receive(path: string): Promise<ArrayBuffer> {
    const device: USBDevice = await this._findDevice(path);

    return device.transferIn(2, 64).then(result => {
      return result.data.buffer.slice(1);
    });
  }

  @debugInOut
  async connect(path: string): Promise<void> {
    const device: USBDevice = await this._findDevice(path);
    await device.open();

    await device.selectConfiguration(1);
    // always resetting -> I don't want to fail when other tab quits before release
    await device.reset();

    await device.claimInterface(2);
  }

  @debugInOut
  async disconnect(path: string): Promise<void> {
    const device: USBDevice = await this._findDevice(path);

    await device.releaseInterface(2);
    await device.close();
  }

  async requestDevice(): Promise<void> {
    // I am throwing away the resulting device, since it appears in enumeration anyway
    await this.usb.requestDevice({filters: TREZOR_DESCS});
  }

  requestNeeded: boolean = true;
}
