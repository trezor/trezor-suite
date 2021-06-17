/* @flow */

import {patch} from './protobuf/monkey_patch';
patch();

import {create as createDefered} from '../defered';
import {parseConfigure} from './protobuf/parse_protocol';
import {buildAndSend} from './send';
import {receiveAndParse} from './receive';
import {resolveTimeoutPromise} from '../defered';

// eslint-disable-next-line quotes
const stringify = require('json-stable-stringify');

import type {LowlevelTransportSharedPlugin, TrezorDeviceInfoDebug} from './sharedPlugin';
import type {Defered} from '../defered';
import type {Messages} from './protobuf/messages';
import type {MessageFromTrezor, TrezorDeviceInfoWithSession, AcquireInput} from '../transport';

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
  previous: ?string,
  debug: boolean
} | {
  type: 'acquire-done',
} | {
  type: 'acquire-failed',
} | {
  type: 'get-sessions',
} | {
  type: 'get-sessions-and-disconnect',
  devices: Array<TrezorDeviceInfoDebug>
} | {
  type: 'release-intent',
  session: string,
  debug: boolean
} | {
  type: 'release-onclose',
  session: string,
} | {
  type: 'release-done',
} | {
  type: 'enumerate-intent',
} | {
  type: 'enumerate-done',
};

export type MessageFromSharedWorker = {
  type: 'ok'
} | {
  type: 'wrong-previous-session'
} | {
  type: 'double-release'
} | {
  type: 'sessions',
  debugSessions: {[path: string]: string};
  normalSessions: {[path: string]: string};
} | {
  type: 'session-number',
  number: string
} | {
  type: 'path',
  path: string;
  otherSession: ?string,
} | {
  type: 'other-session',
  otherSession: ?string,
};

export default class LowlevelTransportWithSharedConnections {
  name: string = `LowlevelTransportWithSharedConnections`;

  plugin: LowlevelTransportSharedPlugin;
  debug: boolean = false;

  // path => promise rejecting on release
  deferedDebugOnRelease: {[session: string]: Defered<void>} = {};
  deferedNormalOnRelease: {[session: string]: Defered<void>} = {};

  _messages: ?Messages;
  version: string;
  configured: boolean = false;

  _sharedWorkerFactory: ?() => ?SharedWorker;
  sharedWorker: ?SharedWorker;

  stopped: boolean = false;

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
    await this.sendToWorker({type: `enumerate-intent`});
    let devices: Array<TrezorDeviceInfoDebug> = [];
    try {
      devices = await this.plugin.enumerate();
    } finally {
      await this.sendToWorker({type: `enumerate-done`});
    }

    const sessionsM = await this.sendToWorker({type: `get-sessions-and-disconnect`, devices});
    if (sessionsM.type !== `sessions`) {
      throw new Error(`Wrong reply`);
    }
    const debugSessions = sessionsM.debugSessions;
    const normalSessions = sessionsM.normalSessions;

    const devicesWithSessions = devices.map(device => {
      const session = normalSessions[device.path];
      const debugSession = debugSessions[device.path];
      return {
        path: device.path,
        session: session,
        debug: device.debug,
        debugSession: debugSession,
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
    Object.keys(this.deferedDebugOnRelease).forEach(session => {
      if (connected[session] == null) {
        this._releaseCleanup(session, true);
      }
    });
    Object.keys(this.deferedNormalOnRelease).forEach(session => {
      if (connected[session] == null) {
        this._releaseCleanup(session, false);
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
  async acquire(input: AcquireInput, debugLink: boolean): Promise<string> {
    const messBack = await this.sendToWorker({
      type: `acquire-intent`,
      path: input.path,
      previous: input.previous,
      debug: debugLink,
    });
    if (messBack.type === `wrong-previous-session`) {
      throw new Error(`wrong previous session`);
    }

    if (messBack.type !== `other-session`) {
      throw new Error(`Strange reply`);
    }

    const reset = messBack.otherSession == null;

    try {
      await this.plugin.connect(input.path, debugLink, reset);
    } catch (e) {
      await this.sendToWorker({type: `acquire-failed`});
      throw e;
    }

    const messBack2 = await this.sendToWorker({type: `acquire-done`});
    if (messBack2.type !== `session-number`) {
      throw new Error(`Strange reply.`);
    }

    const session: string = messBack2.number;
    if (debugLink) {
      this.deferedDebugOnRelease[session] = createDefered();
    } else {
      this.deferedNormalOnRelease[session] = createDefered();
    }
    return session;
  }

  @debugInOut
  async release(session: string, onclose: boolean, debugLink: boolean): Promise<void> {
    if (onclose && !debugLink) {
      // if we wait for worker messages, shared worker survives
      // and delays closing
      // so we "fake" release
      this.sendToWorker({type: `release-onclose`, session});
      return;
    }
    const messback = await this.sendToWorker({type: `release-intent`, session, debug: debugLink});
    if (messback.type === `double-release`) {
      throw new Error(`Trying to double release.`);
    }
    if (messback.type !== `path`) {
      throw new Error(`Strange reply.`);
    }
    const path = messback.path;
    const otherSession = messback.otherSession;
    const last = otherSession == null;

    this._releaseCleanup(session, debugLink);
    try {
      await this.plugin.disconnect(path, debugLink, last);
    } catch (e) {
      // ignore release errors, it's not important that much
    }
    await this.sendToWorker({type: `release-done`});
  }

  _releaseCleanup(session: string, debugLink: boolean) {
    const table = debugLink ? this.deferedDebugOnRelease : this.deferedNormalOnRelease;
    if (table[session] != null) {
      table[session].reject(new Error(`Device released or disconnected`));
      delete table[session];
    }
  }

  @debugInOut
  async configure(signedData: JSON | string): Promise<void> {
    const messages = parseConfigure(signedData);
    this._messages = messages;
    this.configured = true;
  }

  _sendLowlevel(path: string, debug: boolean): (data: ArrayBuffer) => Promise<void> {
    return (data) => this.plugin.send(path, data, debug);
  }

  _receiveLowlevel(path: string, debug: boolean): () => Promise<ArrayBuffer> {
    return () => this.plugin.receive(path, debug);
  }

  messages(): Messages {
    if (this._messages == null) {
      throw new Error(`Transport not configured.`);
    }
    return this._messages;
  }

  async doWithSession<X>(session: string, debugLink: boolean, inside:(path: string) => Promise<X>): Promise<X> {
    const sessionsM = await this.sendToWorker({type: `get-sessions`});
    if (sessionsM.type !== `sessions`) {
      throw new Error(`Wrong reply`);
    }
    const sessionsMM = debugLink ? sessionsM.debugSessions : sessionsM.normalSessions;

    let path_: ?string = null;
    Object.keys(sessionsMM).forEach(kpath => {
      if (sessionsMM[kpath] === session) {
        path_ = kpath;
      }
    });

    if (path_ == null) {
      throw new Error(`Session not available.`);
    }
    const path: string = path_;

    const resPromise = await inside(path);

    const defered = debugLink
      ? this.deferedDebugOnRelease[session]
      : this.deferedNormalOnRelease[session];

    return Promise.race([defered.rejectingPromise, resPromise]);
  }

  @debugInOut
  async call(session: string, name: string, data: Object, debugLink: boolean): Promise<MessageFromTrezor> {
    const callInside: (path: string) => Promise<MessageFromTrezor> = async (path: string) => {
      const messages = this.messages();
      await buildAndSend(messages, this._sendLowlevel(path, debugLink), name, data);
      const message = await receiveAndParse(messages, this._receiveLowlevel(path, debugLink));
      return message;
    };

    return this.doWithSession(session, debugLink, callInside);
  }

  @debugInOut
  async post(session: string, name: string, data: Object, debugLink: boolean): Promise<void> {
    const callInside: (path: string) => Promise<void> = async (path: string) => {
      const messages = this.messages();
      await buildAndSend(messages, this._sendLowlevel(path, debugLink), name, data);
    };

    return this.doWithSession(session, debugLink, callInside);
  }

  @debugInOut
  async read(session: string, debugLink: boolean): Promise<MessageFromTrezor> {
    const callInside: (path: string) => Promise<MessageFromTrezor> = async (path: string) => {
      const messages = this.messages();
      const message = await receiveAndParse(messages, this._receiveLowlevel(path, debugLink));
      return message;
    };

    return this.doWithSession(session, debugLink, callInside);
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
    if (this.stopped) {
      return Promise.reject(`Transport stopped.`);
    }

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

  setBridgeLatestUrl(url: string): void {}
  setBridgeLatestVersion(version: string): void {}

  isOutdated: boolean = false;

  stop(): void {
    this.stopped = true;
    this.sharedWorker = null;
  }
}
