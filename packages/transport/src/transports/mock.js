/* @flow */

"use strict";

import type {Transport, TrezorDeviceInfo} from './index.js';

export class MockTransport {

  enumerate(): Promise<Array<TrezorDeviceInfo>> {
    return Promise.resolve([]);
  }

  send(device: string, session: string, data: ArrayBuffer): Promise<void> {
    return Promise.resolve();
  }

  receive(device: string, session: string): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  connect(device: string): Promise<string> {
    return Promise.resolve(`mock`);
  }

  disconnect(session: string): Promise<void> {
    return Promise.resolve();
  }
}

export const mockTransport: Transport = new MockTransport();
