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

import type {LowlevelTransportSharedPlugin} from './sharedPlugin';
import type {Defered} from '../defered';
import type {Messages} from './protobuf/messages';
import type {MessageFromTrezor, TrezorDeviceInfo, TrezorDeviceInfoWithSession, AcquireInput} from '../transport';

import {debugInOut} from '../debug-decorator';
import {postModuleMessage} from './sharedConnectionWorker';

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
} | {
  type: 'acquire-failed',
} | {
  type: 'get-sessions',
} | {
  type: 'get-sessions-and-disconnect',
  devices: Array<TrezorDeviceInfo>
} | {
  type: 'release-intent',
  session: string,
} | {
  type: 'release-done',
};

export type MessageFromSharedWorker = {
  type: 'ok'
} | {
  type: 'wrong-previous-session'
} | {
  type: 'double-release'
} | {
  type: 'sessions',
  sessions: {[path: string]: string};
} | {
  type: 'session-number',
  number: string
} | {
  type: 'path',
  path: string;
};

export default class LowlevelTransportWithSharedConnections {
  name: string = `LowlevelTransportWithSharedConnections`;

  plugin: LowlevelTransportSharedPlugin;
  debug: boolean = false;

  // path => promise rejecting on release
  deferedOnRelease: {[session: string]: Defered<void>} = {};

  _messages: ?Messages;
  version: string;
  configured: boolean = false;

  _sharedWorkerFactory: ?() => ?SharedWorker;
  sharedWorker: ?SharedWorker;

  constructor(plugin: LowlevelTransportSharedPlugin, sharedWorkerFactory: ?() => ?SharedWorker) {
    this.plugin = plugin;
    this.version = plugin.version;
    this._sharedWorkerFactory = sharedWorkerFactory;
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
    const sessionsM = await this.sendToWorker({type: `get-sessions-and-disconnect`, devices});
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

    this._releaseDisconnected(devicesWithSessions);
    return devicesWithSessions.sort(compare);
  }

  _releaseDisconnected(devices: Array<TrezorDeviceInfoWithSession>) {
    const connected: {[session: string]: boolean} = {};
    devices.forEach(device => {
      if (device.session != null) {
        connected[device.session] = true;
      }
    });
    Object.keys(this.deferedOnRelease).forEach(session => {
      if (connected[session] == null) {
        this._releaseCleanup(session);
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

    try {
      await this.plugin.connect(input.path);
    } catch (e) {
      await this.sendToWorker({type: `acquire-failed`});
      throw e;
    }

    const messBack2 = await this.sendToWorker({type: `acquire-done`});
    if (messBack2.type !== `session-number`) {
      throw new Error(`Strange reply.`);
    }

    const session: string = messBack2.number;

    this.deferedOnRelease[session] = createDefered();
    return session;
  }

  @debugInOut
  async release(session: string): Promise<void> {
    const messback = await this.sendToWorker({type: `release-intent`, session});
    if (messback.type === `double-release`) {
      throw new Error(`Trying to double release.`);
    }
    if (messback.type !== `path`) {
      throw new Error(`Strange reply.`);
    }
    const path = messback.path;

    this._releaseCleanup(session);
    try {
      await this.plugin.disconnect(path);
    } catch (e) {
      // ignore release errors, it's not important that much
    }
    await this.sendToWorker({type: `release-done`});
  }

  _releaseCleanup(session: string) {
    if (this.deferedOnRelease[session] != null) {
      this.deferedOnRelease[session].reject(new Error(`Device released or disconnected`));
      delete this.deferedOnRelease[session];
    }
  }

  @debugInOut
  async configure(signedData: string): Promise<void> {
    const buffer = verifyHexBin(signedData);
    const messages = parseConfigure(buffer);
    this._messages = messages;
    this.configured = true;
  }

  _sendLowlevel(path: string): (data: ArrayBuffer) => Promise<void> {
    return (data) => this.plugin.send(path, data);
  }

  _receiveLowlevel(path: string): () => Promise<ArrayBuffer> {
    return () => this.plugin.receive(path);
  }

  @debugInOut
  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    const sessionsM = await this.sendToWorker({type: `get-sessions`});

    if (this._messages == null) {
      throw new Error(`Transport not configured.`);
    }
    const messages = this._messages;

    if (sessionsM.type !== `sessions`) {
      throw new Error(`Wrong reply`);
    }

    let path_: ?string = null;
    Object.keys(sessionsM.sessions).forEach(kpath => {
      if (sessionsM.sessions[kpath] === session) {
        path_ = kpath;
      }
    });

    if (path_ == null) {
      throw new Error(`Session not available.`);
    }
    const path: string = path_;

    const resPromise: Promise<MessageFromTrezor> = (async () => {
      await buildAndSend(messages, this._sendLowlevel(path), name, data);
      const message = await receiveAndParse(messages, this._receiveLowlevel(path));
      return message;
    })();

    return Promise.race([this.deferedOnRelease[session].rejectingPromise, resPromise]);
  }

  @debugInOut
  async init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    this.requestNeeded = this.plugin.requestNeeded;
    await this.plugin.init(debug);
    // create the worker ONLY when the plugin is successfully inited
    if (this._sharedWorkerFactory != null) {
      this.sharedWorker = this._sharedWorkerFactory();
      if (this.sharedWorker != null) {
        this.sharedWorker.port.onmessage = (e) => {
          // $FlowIssue
          this.receiveFromWorker(e.data);
        };
      }
    }
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

    // when shared worker is not loaded as a shared loader, use it as a module instead
    if (this.sharedWorker != null) {
      this.sharedWorker.port.postMessage({id, message});
    } else {
      postModuleMessage({id, message}, (m) => this.receiveFromWorker(m));
    }

    return this.defereds[id].promise;
  }

  receiveFromWorker(m: {id: number, message: MessageFromSharedWorker}) {
    this.defereds[m.id].resolve(m.message);
    delete this.defereds[m.id];
  }
}
