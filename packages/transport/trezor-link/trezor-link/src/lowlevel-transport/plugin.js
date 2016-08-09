/* @flow */

"use strict";

import type {TrezorDeviceInfo} from '../transport';

export type LowlevelTransportPlugin = {
  enumerate: () => Promise<Array<TrezorDeviceInfo>>;
  send: (path: string, session: string, data: ArrayBuffer) => Promise<void>;
  receive: (path: string, session: string) => Promise<ArrayBuffer>;
  connect: (path: string) => Promise<string>;
  disconnect: (path: string, session: string) => Promise<void>;
}

