/* @flow */

import {patch} from './protobuf/monkey_patch';
patch();

import {create as createDefered} from '../defered';
import {parseConfigure} from './protobuf/parse_protocol';
import {verifyHexBin} from './verify';
import {buildAndSend} from './send';
import {receiveAndParse} from './receive';
import {resolveTimeoutPromise} from '../defered';

// eslint-disable-next-line quotes
const stringify = require('json-stable-stringify');

import type {LowlevelTransportPlugin} from './plugin';
import type {Defered} from '../defered';
import type {Messages} from './protobuf/messages';
import type {MessageFromTrezor, TrezorDeviceInfoWithSession, AcquireInput} from '../transport';

import {debugInOut} from '../debug-decorator';

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

function compare(a: TrezorDeviceInfoWithSession, b: TrezorDeviceInfoWithSession): number {
  if (!isNaN(parseInt(a.path))) {
    return parseInt(a.path) - parseInt(b.path);
  } else {
    return a.path < b.path ? -1 : (a.path > b.path ? 1 : 0);
  }
}

const ITER_MAX = 60;
const ITER_DELAY = 500;

export default class LowlevelTransport {
  name: string = `LowlevelTransport`;

  plugin: LowlevelTransportPlugin;
  _lock: Promise<any> = Promise.resolve();
  debug: boolean = false;

  // session => promise rejecting on release
  deferedOnRelease: {[session: string]: Defered<void>} = {};

  // path => session
  connections: {[path: string]: string} = {};

  // session => path
  reverse: {[session: string]: string} = {};

  _messages: ?Messages;
  version: string;
  configured: boolean = false;

  constructor(plugin: LowlevelTransportPlugin) {
    this.plugin = plugin;
    this.version = plugin.version;
  }

  lock<X>(fn: () => (Promise<X>)): Promise<X> {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }

  @debugInOut
  enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this._silentEnumerate();
  }

  _silentEnumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.lock(async (): Promise<Array<TrezorDeviceInfoWithSession>> => {
      const devices = await this.plugin.enumerate();
      const devicesWithSessions = devices.map(device => {
        const session = this.connections[device.path];
        return {
          path: device.path,
          session: session,
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

  @debugInOut
  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    const oldStringified = stableStringify(old);
    const last = old == null ? this._lastStringified : oldStringified;
    return this._runIter(0, last);
  }

  async _runIter(iteration: number, oldStringified: string): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devices = await this._silentEnumerate();
    const stringified = stableStringify(devices);
    if ((stringified !== oldStringified) || (iteration === ITER_MAX)) {
      this._lastStringified = stringified;
      return devices;
    }
    await resolveTimeoutPromise(ITER_DELAY, null);
    return this._runIter(iteration + 1, stringified);
  }

  async _checkAndReleaseBeforeAcquire(input: AcquireInput): Promise<void> {
    const realPrevious = this.connections[input.path];

    if (input.checkPrevious) {
      let error = false;
      if (realPrevious == null) {
        error = (input.previous != null);
      } else {
        error = (input.previous !== realPrevious);
      }
      if (error) {
        throw new Error(`wrong previous session`);
      }
    }
    if (realPrevious != null) {
      await this._realRelease(input.path, realPrevious);
    }
  }

  @debugInOut
  async acquire(input: AcquireInput): Promise<string> {
    return this.lock(async (): Promise<string> => {
      await this._checkAndReleaseBeforeAcquire(input);
      const session = await this.plugin.connect(input.path);
      this.connections[input.path] = session;
      this.reverse[session] = input.path;
      this.deferedOnRelease[session] = createDefered();
      return session;
    });
  }

  @debugInOut
  async release(session: string): Promise<void> {
    const path = this.reverse[session];
    if (path == null) {
      throw new Error(`Trying to double release.`);
    }
    return this.lock(() => this._realRelease(path, session));
  }

  async _realRelease(path:string, session: string): Promise<void> {
    await this.plugin.disconnect(path, session);
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

  @debugInOut
  async configure(signedData: string): Promise<void> {
    const buffer = verifyHexBin(signedData);
    const messages = parseConfigure(buffer);
    this._messages = messages;
    this.configured = true;
  }

  _sendLowlevel(session: string): (data: ArrayBuffer) => Promise<void> {
    const path: string = this.reverse[session];
    return (data) => this.plugin.send(path, session, data);
  }

  _receiveLowlevel(session: string): () => Promise<ArrayBuffer> {
    const path: string = this.reverse[session];
    return () => this.plugin.receive(path, session);
  }

  @debugInOut
  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    if (this._messages == null) {
      throw new Error(`Transport not configured.`);
    }
    if (this.reverse[session] == null) {
      throw new Error(`Trying to use device after release.`);
    }

    const messages = this._messages;

    const doCall: () => Promise<MessageFromTrezor> = async () => {
      const resPromise: Promise<MessageFromTrezor> = (async () => {
        await buildAndSend(messages, this._sendLowlevel(session), name, data);
        const message = await receiveAndParse(messages, this._receiveLowlevel(session));
        return message;
      })();

      return Promise.race([this.deferedOnRelease[session].rejectingPromise, resPromise]);
    };

    const mightlock: Promise<MessageFromTrezor> = this.plugin.allowsWriteAndEnumerate
      ? doCall()
      : this.lock(doCall);

    return mightlock;
  }

  @debugInOut
  async init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    this.requestNeeded = this.plugin.requestNeeded;
    return this.plugin.init(debug);
  }

  async requestDevice(): Promise<void> {
    return this.plugin.requestDevice();
  }

  requestNeeded: boolean = false;
}
