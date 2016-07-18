/* @flow */

"use strict";

// does not have session
export type TrezorDeviceInfo = {
  path: string;
}

export type Transport = {
  enumerate: () => Promise<Array<TrezorDeviceInfo>>;
  send: (path: string, session: string, data: ArrayBuffer) => Promise<void>;
  receive: (path: string, session: string) => Promise<ArrayBuffer>;
  connect: (path: string) => Promise<string>;
  disconnect: (path: string, session: string) => Promise<void>;
}
