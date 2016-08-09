/* @flow */

"use strict";

import {create as createDefered} from '../defered';
import {parseConfigure} from '../protobuf/parse_protocol';
import {verifyHexBin} from './verify';
import {buildAndSend} from './send';
import {receiveAndParse} from './receive';
import {CombinedTransport} from '../combined-transport';

import type {TrezorDeviceInfo, Transport} from '../transport';
import type {Defered} from '../defered';
import type {Messages} from '../protobuf/messages';

export type MessageFromTrezor = {type: string, message: Object};

// eslint-disable-next-line quotes
const stringify = require('json-stable-stringify');

export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
  session: ?string;
}

type InternalAcquireInput = {
  path: string;
  previous: ?string;
  checkPrevious: boolean;
}

export type AcquireInput = {
  path: string;
  previous: ?string;
} | string;

function stableStringify(devices: ?Array<TrezorDeviceInfoWithSession>): string {
  if (devices == null) {
    return `null`;
  }
  const pureDevices = devices.map(device => {
    const path = device.path;
    const session = device.session == null ? null : device.session;
    return {path, session};
  });
  return stringify(pureDevices);
}

function parseAcquireInput(input: AcquireInput): InternalAcquireInput {
  // eslint-disable-next-line quotes
  if (typeof input !== 'string') {
    const path = input.path.toString();
    const previous = input.previous == null ? null : input.previous.toString();
    return {
      path,
      previous,
      checkPrevious: true,
    };
  } else {
    const path = input.toString();
    return {
      path,
      previous: null,
      checkPrevious: false,
    };
  }
}

function compare(a: TrezorDeviceInfoWithSession, b: TrezorDeviceInfoWithSession): number {
  if (!isNaN(a.path)) {
    return parseInt(a.path) - parseInt(b.path);
  } else {
    return a.path < a.path ? -1 : (a.path > a.path ? 1 : 0);
  }
}

function timeoutPromise(delay: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(), delay);
  });
}

const ITER_MAX = 60;
const ITER_DELAY = 500;

export class Handler {
  transport: Transport;
  _lock: Promise<any> = Promise.resolve();

  // path => promise rejecting on release
  deferedOnRelease: {[session: string]: Defered} = {};

  // path => session
  connections: {[path: string]: string} = {};

  // session => path
  reverse: {[session: string]: string} = {};

  _messages: ?Messages;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  lock<X>(fn: () => (Promise<X>)): Promise<X> {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }

  enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.lock(async (): Promise<Array<TrezorDeviceInfoWithSession>> => {
      const devices = await this.transport.enumerate();
      const devicesWithSessions = devices.map(device => {
        return {
          ...device,
          session: this.connections[device.path],
        };
      });
      this._releaseDisconnected(devicesWithSessions);
      return devicesWithSessions.sort(compare);
    });
  }

  _releaseDisconnected(devices: Array<TrezorDeviceInfoWithSession>) {
    const connected: {[path: string]: boolean} = {};
    devices.forEach(device => {
      connected[device.path] = true;
    });
    Object.keys(this.connections).forEach(path => {
      if (connected[path] == null) {
        if (this.connections[path] != null) {
          this._releaseCleanup(this.connections[path]);
        }
      }
    });
  }

  _lastStringified: string = ``;

  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    const oldStringified = stableStringify(old);
    const last = old == null ? this._lastStringified : oldStringified;
    return this._runIter(0, last);
  }

  async _runIter(iteration: number, oldStringified: string): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devices = await this.enumerate();
    const stringified = stableStringify(devices);
    if ((stringified !== oldStringified) || (iteration === ITER_MAX)) {
      this._lastStringified = stringified;
      return devices;
    }
    await timeoutPromise(ITER_DELAY);
    return this._runIter(iteration + 1, stringified);
  }

  async _checkAndReleaseBeforeAcquire(parsed: InternalAcquireInput): Promise<any> {
    const realPrevious = this.connections[parsed.path];
    if (parsed.checkPrevious) {
      let error = false;
      if (realPrevious == null) {
        error = (parsed.previous != null);
      } else {
        error = (parsed.previous !== realPrevious);
      }
      if (error) {
        throw new Error(`wrong previous session`);
      }
    }
    if (realPrevious != null) {
      return this._realRelease(parsed.path, realPrevious);
    }
  }

  async acquire(input: AcquireInput): Promise<string> {
    const parsed = parseAcquireInput(input);
    return this.lock(async (): Promise<string> => {
      await this._checkAndReleaseBeforeAcquire(parsed);
      const session = await this.transport.connect(parsed.path);
      this.connections[parsed.path] = session;
      this.reverse[session] = parsed.path;
      this.deferedOnRelease[session] = createDefered();
      return session;
    });
  }

  async release(session: string): Promise<void> {
    const path = this.reverse[session];
    if (path == null) {
      throw new Error(`Trying to double release.`);
    }
    return this.lock(() => this._realRelease(path, session));
  }

  async _realRelease(path:string, session: string): Promise<void> {
    await this.transport.disconnect(path, session);
    this._releaseCleanup(session);
  }

  _releaseCleanup(session: string) {
    const path: string = this.reverse[session];
    delete this.reverse[session];
    delete this.connections[path];
    this.deferedOnRelease[session].reject(new Error(`Device released or disconnected`));
    delete this.deferedOnRelease[session];
    return;
  }

  async configure(signedData: string): Promise<void> {
    const buffer = verifyHexBin(signedData);
    const messages = parseConfigure(buffer);
    this._messages = messages;
  }

  _sendTransport(session: string): (data: ArrayBuffer) => Promise<void> {
    const path: string = this.reverse[session];
    return (data) => this.transport.send(path, session, data);
  }

  _receiveTransport(session: string): () => Promise<ArrayBuffer> {
    const path: string = this.reverse[session];
    return () => this.transport.receive(path, session);
  }

  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    if (this._messages == null) {
      throw new Error(`Handler not configured.`);
    }
    if (this.reverse[session] == null) {
      throw new Error(`Trying to use device after release.`);
    }
    const messages = this._messages;
    const resPromise: Promise<MessageFromTrezor> = (async () => {
      await buildAndSend(messages, this._sendTransport(session), name, data);
      return receiveAndParse(messages, this._receiveTransport(session));
    })();
    return Promise.race([this.deferedOnRelease[session].rejectingPromise, resPromise]);
  }

  async hasMessages(): Promise<boolean> {
    return (this._messages != null);
  }

  static combineTransports(transports: {[short: string]: Transport}): Transport {
    return new CombinedTransport(transports);
  }
}
