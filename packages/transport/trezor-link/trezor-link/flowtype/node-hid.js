// from flow-typed
// https://github.com/flowtype/flow-typed/blob/master/definitions/npm/node-hid_v0.x.x/flow_%3E%3Dv0.17.x/node-hid_v0.x.x.js
declare module 'node-hid' {

  declare type HIDDeviceDescription = {
    vendorId: number;
    productId: number;
    path: string;
    serialNumber: string;
    manufacturer: string;
    product: string;
    release: number;
    interface: number;
  }
  
  declare function devices(): Array<HIDDeviceDescription>;

  declare class HID extends events$EventEmitter {
    constructor(pathOrVid: string|number, pid?: ?number): void;
    write(buffer: Array<number>): void;
    read(fun: (err?: Error, data?: Buffer) => void): void;
    readSync(): Array<number>;
    readTimeout(time_out: number): Array<number>;
    sendFeatureReport(data: Array<number>): void;
    getFeatureRerport(): Array<number>;
    pause(): void;
    resume(): void;
    close(): void;
  }

}
