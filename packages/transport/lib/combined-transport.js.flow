/* @flow */

"use strict";

import type {Transport, TrezorDeviceInfo} from './transport';

export class CombinedTransport {
  transports: {[short: string]: Transport};

  constructor(transports: {[short: string]: Transport}) {
    this.transports = transports;
    this._shorts().forEach(short => {
      // sanity check
      if (typeof short !== `string`) {
        throw new Error(`Short name is not a string`);
      }
      if (short.includes(`-`)) {
        throw new Error(`Transport name shouldn't  include '-'.`);
      }
    });
  }

  _shorts(): Array<string> {
    return Object.keys(this.transports);
  }

  enumerate(): Promise<Array<TrezorDeviceInfo>> {
    const enumerations = this._shorts().map(short => {
      const transport = this.transports[short];
      return transport.enumerate().then(devices => {
        return devices.map(device => {
          return {path: `${short}-${device.path}`};
        });
      });
    });
    return Promise.all(enumerations).then(enumerationResults => {
      return enumerationResults.reduce((a, b) => a.concat(b), []);
    });
  }

  _parse(path: string): {actual: string, short: string, transport: Transport} {
    if (!path.includes(`-`)) {
      throw new Error(`Input doesn't include '-'.`);
    }
    const [short, ...actualSplit] = path.split(`-`);
    const actual = actualSplit.join(`-`);
    const transport = this.transports[short];
    if (transport == null) {
      throw new Error(`Transport ${short} is not defined.`);
    }
    return {actual, short, transport};
  }

  _parseBoth(path: string, session: string): {transport: Transport, actualPath: string, actualSession: string} {
    const {actual: actualPath, transport: transportPath} = this._parse(path);
    const {actual: actualSession, transport: transportSession} = this._parse(session);
    if (transportPath !== transportSession) {
      throw new Error(`Session transport doesn't equal path transport.`);
    }

    return {
      transport: transportPath,
      actualPath,
      actualSession,
    };
  }

  send(path: string, session: string, data: ArrayBuffer): Promise<void> {
    const {transport, actualPath, actualSession} = this._parseBoth(path, session);
    return transport.send(actualPath, actualSession, data);
  }

  receive(path: string, session: string): Promise<ArrayBuffer> {
    const {transport, actualPath, actualSession} = this._parseBoth(path, session);
    return transport.receive(actualPath, actualSession);
  }

  connect(path: string): Promise<string> {
    const {transport, short, actual} = this._parse(path);
    return transport.connect(actual).then(session => `${short}-${session}`);
  }

  disconnect(path: string, session: string): Promise<void> {
    const {transport, actualPath, actualSession} = this._parseBoth(path, session);
    return transport.disconnect(actualPath, actualSession);
  }
}
