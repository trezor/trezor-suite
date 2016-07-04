/* @flow */

"use strict";

import type {TrezorDeviceInfo, Transport} from './transports';
import {create as createDefered} from './defered';
import type {Defered} from './defered';

// eslint-disable-next-line quotes
const stringify = require('json-stable-stringify');

type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
  session: ?string;
}

type InternalAcquireInput = {
  path: string;
  previous: ?string;
  checkPrevious: boolean;
}

type AcquireInput = {
  path: string;
  previous: ?string;
} | string;

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
  constructor(transport: Transport) {
    this.transport = transport;
  }

  _lock: Promise<any> = Promise.resolve();
  lock<X>(fn: () => (X|Promise<X>)): Promise<X> {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }

  // path => promise rejecting on release
  deferedOnRelease: {[path: string]: Defered};

  // path => session
  connections: {[path: string]: string};

  // session => path
  reverse: {[session: string]: string};

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
    const oldStringified = stringify(old);
    const last = old == null ? this._lastStringified : oldStringified;
    return this._runIter(0, last);
  }

  _runIter(iteration: number, oldStringified: string): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.enumerate().then(devices => {
      const stringified = stringify(devices);
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
      const releasePromise: Promise<void> = this._realRelease(realPrevious);
      return releasePromise;
    } else {
      return Promise.resolve();
    }
  }

  acquire(input: AcquireInput): Promise<{session: string}> {
    const parsed = parseAcquireInput(input);
    return this.lock((): Promise<{session: string}> => {
      return this._checkAndReleaseBeforeAcquire(parsed).then(() =>
        this.transport.connect(parsed.path)
      ).then((session: string) => {
        this.connections[parsed.path] = session;
        this.reverse[session] = parsed.path;
        this.deferedOnRelease[parsed.path] = createDefered();
        return {session: session};
      });
    });
  }

  _realRelease(path: string): Promise<void> {
    return this.transport.disconnect(path).then(() => {
      this._releaseCleanup(path);
    });
  }

  _releaseCleanup(path: string) {
    const session: string = this.connections[path];
    delete this.reverse[session];
    delete this.connections[path];
    this.deferedOnRelease[path].reject(new Error(`Device released or disconnected`));
    return;
  }
}
