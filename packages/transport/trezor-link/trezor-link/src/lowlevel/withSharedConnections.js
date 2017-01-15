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
import type {MessageFromTrezor, TrezorDeviceInfo, TrezorDeviceInfoWithSession, AcquireInput} from '../transport';

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

export type MessageToSharedWorker = {
  type: 'acquire-intent',
  path: string,
  checkPrevious: boolean,
  previous: ?string
} | {
  type: 'acquire-done',
  session: string,
} | {
  type: 'acquire-failed',
} | {
  type: 'get-sessions',
} | {
  type: 'release-intent',
} | {
  type: 'release-done',
  path: string,
} | {
  type: 'release-failed',
};

export type MessageFromSharedWorker = {
  type: 'ok'
} | {
  type: 'wrong-previous-session'
} | {
  type: 'sessions',
  sessions: {[path: string]: string};
};

export default class LowlevelTransportWithSharedConnections {
  name: string = `LowlevelTransportWithSharedConnections`;

  plugin: LowlevelTransportPlugin;
  debug: boolean = false;

  // path => promise rejecting on release
  deferedOnRelease: {[session: string]: Defered<void>} = {};

  // path => session, but only for my devices
  connections: {[path: string]: string} = {};

  // session => path, but only for my devices
  reverse: {[session: string]: string} = {};

  _messages: ?Messages;
  version: string;
  configured: boolean = false;

  sharedWorker: SharedWorker;

  constructor(plugin: LowlevelTransportPlugin, sharedWorker: SharedWorker) {
    this.plugin = plugin;
    this.version = plugin.version;
    this.sharedWorker = sharedWorker;
    sharedWorker.port.onmessage = (e) => {
      // $FlowIssue
      this.receiveFromWorker(e.data);
    };
    if (!this.plugin.allowsWriteAndEnumerate) {
      // This should never happen anyway
      throw new Error(`Plugin with shared connections cannot disallow write and enumerate`);
    }
  }

  @debugInOut
  enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this._silentEnumerate();
  }

  async _silentEnumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devices: Array<TrezorDeviceInfo> = await this.plugin.enumerate();
    const sessionsM = await this.sendToWorker({type: `get-sessions`});
    if (sessionsM.type !== `sessions`) {
      throw new Error(`Wrong reply`);
    }
    const sessions = sessionsM.sessions;

    const devicesWithSessions = devices.map(device => {
      const session = sessions[device.path];
      return {
        path: device.path,
        session: session,
      };
    });

    // TODO - what if this.connections / this.reverse differ from what worker gives me?
    // Can that actually happen?
    this._releaseDisconnected(devicesWithSessions);
    return devicesWithSessions.sort(compare);
  }

  _releaseDisconnected(devices: Array<TrezorDeviceInfoWithSession>) {
    const connected: {[path: string]: boolean} = {};
    devices.forEach(device => {
      connected[device.path] = true;
    });
    Object.keys(this.connections).forEach(path => {
      if (connected[path] == null) {
        this._releaseCleanup(path);
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

  @debugInOut
  async acquire(input: AcquireInput): Promise<string> {
    const messBack = await this.sendToWorker({type: `acquire-intent`, ...input});
    if (messBack.type === `wrong-previous-session`) {
      throw new Error(`wrong previous session`);
    }

    let session: string = ``;
    try {
      if (this.connections[input.path] != null) {
        await this._realRelease(input.path, this.connections[input.path]);
      }
      session = await this.plugin.connect(input.path, input.previous != null);
    } catch (e) {
      await this.sendToWorker({type: `acquire-failed`});
      throw e;
    }

    await this.sendToWorker({type: `acquire-done`, session});
    this.connections[input.path] = session;
    this.reverse[session] = input.path;
    this.deferedOnRelease[input.path] = createDefered();
    return session;
  }

  @debugInOut
  async release(session: string): Promise<void> {
    await this.sendToWorker({type: `release-intent`});
    try {
      const path = this.reverse[session];
      if (path == null) {
        throw new Error(`Trying to double release.`);
      }
      await this._realRelease(path, session);
      await this.sendToWorker({type: `release-done`, path});
    } catch (e) {
      await this.sendToWorker({type: `release-failed`});
      throw e;
    }
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
    const path: ?string = this.connections[session];
    if (path == null) {
      throw new Error(`Trying to use device after release.`);
    }

    const messages = this._messages;

    const resPromise: Promise<MessageFromTrezor> = (async () => {
      await buildAndSend(messages, this._sendLowlevel(session), name, data);
      const message = await receiveAndParse(messages, this._receiveLowlevel(session));
      return message;
    })();

    return Promise.race([this.deferedOnRelease[path].rejectingPromise, resPromise]);
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

  latestId: number = 0;
  defereds: {[id: number]: Defered<MessageFromSharedWorker>} = {};
  sendToWorker(message: MessageToSharedWorker): Promise<MessageFromSharedWorker> {
    this.latestId++;
    const id = this.latestId;
    this.defereds[id] = createDefered();
    this.sharedWorker.port.postMessage({id, message});
    return this.defereds[id].promise;
  }

  receiveFromWorker(m: {id: number, message: MessageFromSharedWorker}) {
    this.defereds[m.id].resolve(m.message);
    delete this.defereds[m.id];
  }

}
