/* @flow */

export type TrezorDeviceInfoDebug = {
  path: string;
  debug: boolean;
}

export type LowlevelTransportSharedPlugin = {
  +enumerate: () => Promise<Array<TrezorDeviceInfoDebug>>;
  +send: (path: string, data: ArrayBuffer, debug: boolean) => Promise<void>;
  +receive: (path: string, debug: boolean) => Promise<ArrayBuffer>;
  +connect: (path: string, debug: boolean, first: boolean) => Promise<void>;
  +disconnect: (path: string, debug: boolean, last: boolean) => Promise<void>;

  // webusb has a different model, where you have to
  // request device connection
  +requestDevice: () => Promise<void>;
  requestNeeded: boolean;

  +init: (debug: ?boolean) => Promise<void>;
  +version: string;
  +name: string;

  // in signal hid API, there is an issue that we cannot simultaneously
  // write and list devices.
  // HOWEVER, there is a separate (and maybe connected) issue in Chrome,
  // where sometimes write doesn't fail on disconnect unless we enumerate
  // so we need to have an "optional lock"
  allowsWriteAndEnumerate: boolean;

}

