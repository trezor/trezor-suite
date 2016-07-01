/* @flow */

"use strict";

// does not have session
export type TrezorDeviceInfo = {
  path: number | string;
  vendor: number;
  product: number;
}

export type Transport = {
  enumerate: () => Promise<Array<TrezorDeviceInfo>>;
  send: (path: number | string, session: number | string, data: ArrayBuffer) => Promise<void>;
  receive: (path: number | string, session: number | string) => Promise<ArrayBuffer>;
  connect: (path: number | string) => Promise<number|string>;
  disconnect: (session: number) => Promise<void>;
}
