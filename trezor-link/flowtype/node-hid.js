declare module 'node-hid' {
  
  declare type HIDDeviceDescription = {
    vendorId: number;
    productId: number;
    path: string;
  }

  declare function devices(): Array<HIDDeviceDescription>;
  
  declare class HID {
    constructor(path: string): void;
    once(type: string, fn: (data: Buffer|Error) => void): void;
    removeEventListener(type: string, fn: Function): void;
    write(buffer: Array<number>): void;
    pause(): void;
    resume(): void;
    close(): void;
  }
  
}
