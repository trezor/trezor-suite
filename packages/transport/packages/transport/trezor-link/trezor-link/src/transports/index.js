/* @flow */

"use strict";

// does not have session
export type TrezorDeviceInfo = {
  path: string;
  vendor: number;
  product: number;
}

export type Transport = {
  enumerate: () => Promise<Array<TrezorDeviceInfo>>;
  send: (path: string, session: string, data: ArrayBuffer) => Promise<void>;
  receive: (path: string, session: string) => Promise<ArrayBuffer>;
  connect: (path: string) => Promise<string>;
  disconnect: (session: string) => Promise<void>;
}
