/* @flow */

"use strict";

import type {TrezorDeviceInfo, Transport} from '../transport';
import {create as createDefered} from '../defered';
import {parseConfigure} from '../protobuf/parse_protocol';
import {verifyHexBin} from './verify';
import {buildAndSend} from './send';
import {receiveAndParse} from './receive';

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
  deferedOnRelease: {[path: string]: Defered} = {};

  // path => session
  connections: {[path: string]: string} = {};

  // session => path
  reverse: {[session: string]: string} = {};

  _messages: ?Messages;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  lock<X>(fn: () => (X|Promise<X>)): Promise<X> {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }

  enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.lock((): Promise<Array<TrezorDeviceInfoWithSession>> => {
      return this.transport.enumerate().then((devices) => devices.map(device => {
        return {
          ...device,
          session: this.connections[device.path],
        };
      })).then(devices => {
        this._releaseDisconnected(devices);
        return devices;
      }).then(devices => {
        return devices.sort(compare);
      });
    });
  }

  _releaseDisconnected(devices: Array<TrezorDeviceInfoWithSession>) {
  }

  _lastStringified: string = ``;

  listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    const oldStringified = stableStringify(old);
    const last = old == null ? this._lastStringified : oldStringified;
    return this._runIter(0, last);
  }

  _runIter(iteration: number, oldStringified: string): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.enumerate().then(devices => {
      const stringified = stableStringify(devices);
      if ((stringified !== oldStringified) || (iteration === ITER_MAX)) {
        this._lastStringified = stringified;
        return devices;
      }
      return timeoutPromise(ITER_DELAY).then(() => this._runIter(iteration + 1, stringified));
    });
  }

  _checkAndReleaseBeforeAcquire(parsed: InternalAcquireInput): Promise<any> {
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
      const releasePromise: Promise<void> = this._realRelease(parsed.path, realPrevious);
      return releasePromise;
    } else {
      return Promise.resolve();
    }
  }

  acquire(input: AcquireInput): Promise<string> {
    const parsed = parseAcquireInput(input);
    return this.lock((): Promise<string> => {
      return this._checkAndReleaseBeforeAcquire(parsed).then(() =>
        this.transport.connect(parsed.path)
      ).then((session: string) => {
        this.connections[parsed.path] = session;
        this.reverse[session] = parsed.path;
        this.deferedOnRelease[parsed.path] = createDefered();
        return session;
      });
    });
  }

  release(session: string): Promise<void> {
    const path = this.reverse[session];
    return this.lock(() => this._realRelease(path, session));
  }

  _realRelease(path:string, session: string): Promise<void> {
    return this.transport.disconnect(path, session).then(() => {
      this._releaseCleanup(session);
    });
  }

  _releaseCleanup(session: string) {
    const path: string = this.reverse[session];
    delete this.reverse[session];
    delete this.connections[path];
    this.deferedOnRelease[path].reject(new Error(`Device released or disconnected`));
    return;
  }

  configure(signedData: string): Promise<void> {
    try {
      const buffer = verifyHexBin(signedData);
      const messages = parseConfigure(buffer);
      this._messages = messages;
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  _sendTransport(session: string): (data: ArrayBuffer) => Promise<void> {
    const path: string = this.reverse[session];
    return (data) => this.transport.send(path, session, data);
  }

  _receiveTransport(session: string): () => Promise<ArrayBuffer> {
    const path: string = this.reverse[session];
    return () => this.transport.receive(path, session);
  }

  call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    if (this._messages == null) {
      return Promise.reject(new Error(`Handler not configured.`));
    }
    const messages = this._messages;
    return buildAndSend(messages, this._sendTransport(session), name, data).then(() => {
      return receiveAndParse(messages, this._receiveTransport(session));
    });
  }

  hasMessages(): Promise<boolean> {
    if (this._messages == null) {
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }
  }
}
