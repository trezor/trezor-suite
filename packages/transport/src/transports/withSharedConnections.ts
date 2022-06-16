import { create as createDeferred, resolveTimeoutPromise } from '../utils/defered';
// import { parseConfigure } from '../lowlevel/protobuf/messages';
import { postModuleMessage } from '../workers/sharedConnectionWorker';
import { Transport } from './abstract';
import type { Deferred } from '../utils/defered';
import type {
    MessageFromTrezor,
    TrezorDeviceInfoWithSession,
    AcquireInput,
    TrezorDeviceInfoDebug,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stringify = require('json-stable-stringify');

function stableStringify(devices?: Array<TrezorDeviceInfoWithSession>) {
    if (devices == null) {
        return 'null';
    }

    const pureDevices = devices.map(device => {
        const { path } = device;
        const session = device.session == null ? null : device.session;
        return { path, session };
    });

    return stringify(pureDevices);
}

function compare(a: TrezorDeviceInfoWithSession, b: TrezorDeviceInfoWithSession) {
    if (!Number.isNaN(parseInt(a.path, 10))) {
        return parseInt(a.path, 10) - parseInt(b.path, 10);
    }
    if (a.path < b.path) {
        return -1;
    }
    return a.path > b.path ? 1 : 0;
}

const ITER_MAX = 60;
const ITER_DELAY = 500;

export type MessageToSharedWorker =
    | {
          type: 'acquire-intent';
          path: string;
          previous?: string;
          debug: boolean;
      }
    | {
          type: 'acquire-done';
      }
    | {
          type: 'acquire-failed';
      }
    | {
          type: 'get-sessions';
      }
    | {
          type: 'get-sessions-and-disconnect';
          devices: Array<TrezorDeviceInfoDebug>;
      }
    | {
          type: 'release-intent';
          session: string;
          debug: boolean;
      }
    | {
          type: 'release-onclose';
          session: string;
      }
    | {
          type: 'release-done';
      }
    | {
          type: 'enumerate-intent';
      }
    | {
          type: 'enumerate-done';
      };

export type MessageFromSharedWorker =
    | {
          type: 'ok';
      }
    | {
          type: 'wrong-previous-session';
      }
    | {
          type: 'double-release';
      }
    | {
          type: 'sessions';
          debugSessions: { [path: string]: string };
          normalSessions: { [path: string]: string };
      }
    | {
          type: 'session-number';
          number: string;
      }
    | {
          type: 'path';
          path: string;
          otherSession?: string;
      }
    | {
          type: 'other-session';
          otherSession?: string;
      };

export class TransportWithSharedConnections extends Transport {
    _sharedWorkerFactory: undefined | (() => SharedWorker);
    // path => promise rejecting on release
    deferedDebugOnRelease: { [session: string]: Deferred<void> } = {};
    deferedNormalOnRelease: { [session: string]: Deferred<void> } = {};
    defereds: { [id: number]: Deferred<MessageFromSharedWorker> } = {};

    latestId = 0;
    name = 'TransportWithSharedConnections';

    _transport: Transport;

    requestNeeded = false;
    sharedWorker: null | SharedWorker = null;

    constructor(
        // plugin: LowlevelTransportSharedPlugin,
        // sharedWorkerFactory: undefined | (() => SharedWorker),
        { debug = false, transport }: { debug?: boolean; transport: Transport },
    ) {
        super({ debug });

        this._transport = transport;
        this.version = transport.version;

        // this._sharedWorkerFactory = sharedWorkerFactory;
    }

    enumerate() {
        return this._silentEnumerate();
    }

    async _silentEnumerate() {
        await this.sendToWorker({ type: 'enumerate-intent' });

        let devices: Array<TrezorDeviceInfoDebug> = [];
        try {
            devices = await this._transport.enumerate();
        } finally {
            await this.sendToWorker({ type: 'enumerate-done' });
        }

        const sessionsM = await this.sendToWorker({
            type: 'get-sessions-and-disconnect',
            devices,
        });
        if (sessionsM.type !== 'sessions') {
            throw new Error('Wrong reply');
        }
        const { debugSessions } = sessionsM;
        const { normalSessions } = sessionsM;

        const devicesWithSessions = devices.map(device => {
            const session = normalSessions[device.path];
            const debugSession = debugSessions[device.path];
            return {
                path: device.path,
                session,
                debug: device.debug,
                debugSession,
            };
        });

        this._releaseDisconnected(devicesWithSessions);
        return devicesWithSessions.sort(compare);
    }

    _releaseDisconnected(devices: Array<TrezorDeviceInfoWithSession>) {
        const connected: { [session: string]: boolean } = {};
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

    _lastStringified = '';

    listen(old: Array<TrezorDeviceInfoWithSession>) {
        const oldStringified = stableStringify(old);
        const last = old == null ? this._lastStringified : oldStringified;
        return this._runIter(0, last);
    }

    async _runIter(
        iteration: number,
        oldStringified: string,
    ): Promise<Array<TrezorDeviceInfoWithSession>> {
        const devices = await this._silentEnumerate();
        const stringified = stableStringify(devices);
        if (stringified !== oldStringified || iteration === ITER_MAX) {
            this._lastStringified = stringified;
            return devices;
        }
        await resolveTimeoutPromise(ITER_DELAY, null);
        return this._runIter(iteration + 1, stringified);
    }

    async acquire({ input, debug }: { input: AcquireInput; debug: boolean }) {
        const messBack = await this.sendToWorker({
            type: 'acquire-intent',
            path: input.path,
            previous: input.previous,
            debug,
        });

        if (messBack.type === 'wrong-previous-session') {
            throw new Error('wrong previous session');
        }

        if (messBack.type !== 'other-session') {
            throw new Error('Strange reply');
        }

        const reset = messBack.otherSession == null;

        try {
            await this._transport.acquire({ input: { path: input.path }, debug, first: reset });
        } catch (e) {
            await this.sendToWorker({ type: 'acquire-failed' });
            throw e;
        }

        const messBack2 = await this.sendToWorker({ type: 'acquire-done' });
        if (messBack2.type !== 'session-number') {
            throw new Error('Strange reply.');
        }

        const session = messBack2.number;
        if (debug) {
            this.deferedDebugOnRelease[session] = createDeferred();
        } else {
            this.deferedNormalOnRelease[session] = createDeferred();
        }
        return session;
    }

    async release(session: string, onclose: boolean, debugLink: boolean) {
        if (onclose && !debugLink) {
            // if we wait for worker messages, shared worker survives
            // and delays closing
            // so we "fake" release
            this.sendToWorker({ type: 'release-onclose', session });
            return;
        }
        const messback = await this.sendToWorker({
            type: 'release-intent',
            session,
            debug: debugLink,
        });
        if (messback.type === 'double-release') {
            throw new Error('Trying to double release.');
        }
        if (messback.type !== 'path') {
            throw new Error('Strange reply.');
        }
        const { path } = messback;
        const { otherSession } = messback;
        const last = otherSession == null;

        this._releaseCleanup(session, debugLink);
        try {
            await this._transport.release(path, debugLink, last);
        } catch (e) {
            // ignore release errors, it's not important that much
        }
        await this.sendToWorker({ type: 'release-done' });
    }

    _releaseCleanup(session: string, debugLink: boolean) {
        const table = debugLink ? this.deferedDebugOnRelease : this.deferedNormalOnRelease;
        if (table[session] != null) {
            table[session].reject(new Error('Device released or disconnected'));
            delete table[session];
        }
    }

    async doWithSession<X>(
        session: string,
        debugLink: boolean,
        inside: (path: string) => Promise<X>,
    ): Promise<X> {
        const sessionsM = await this.sendToWorker({ type: 'get-sessions' });
        if (sessionsM.type !== 'sessions') {
            throw new Error('Wrong reply');
        }
        const sessionsMM = debugLink ? sessionsM.debugSessions : sessionsM.normalSessions;

        let path_: string | null = null;
        Object.keys(sessionsMM).forEach(kpath => {
            if (sessionsMM[kpath] === session) {
                path_ = kpath;
            }
        });

        if (path_ == null) {
            throw new Error('Session not available.');
        }
        const path = path_;

        const resPromise = await inside(path);

        const defered = debugLink
            ? this.deferedDebugOnRelease[session]
            : this.deferedNormalOnRelease[session];

        return Promise.race([defered.rejectingPromise, resPromise]);
    }

    call({
        name,
        data,
        debug,
        session,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
        debug: boolean;
    }): Promise<MessageFromTrezor> {
        return this.doWithSession(session, debug, () =>
            this._transport.call({ session, name, data, debug }),
        );
    }

    send({
        session,
        name,
        data,
        debug,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
        debug: boolean;
    }) {
        return this.doWithSession(session, debug, () =>
            this._transport.send({ name, session, data, debug }),
        );
    }

    receive({ session, debug }: { session: string; debug: boolean }) {
        return this.doWithSession(session, debug, () => {
            return this._transport.receive({ session, debug });
        });
    }

    async init(debug?: boolean) {
        // this.requestNeeded = this._transport.requestNeeded;
        await this._transport.init(debug);
        // create the worker ONLY when the plugin is successfully inited
        if (this._sharedWorkerFactory) {
            this.sharedWorker = this._sharedWorkerFactory();
            if (this.sharedWorker != null) {
                this.sharedWorker.port.onmessage = e => {
                    this.receiveFromWorker(e.data);
                };
            }
        }
    }

    requestDevice() {
        return this._transport.requestDevice();
    }

    sendToWorker(message: MessageToSharedWorker) {
        this.latestId++;
        const id = this.latestId;
        this.defereds[id] = createDeferred();

        // when shared worker is not loaded as a shared loader, use it as a module instead
        if (this.sharedWorker != null) {
            this.sharedWorker.port.postMessage({ id, message });
        } else {
            postModuleMessage({ id, message }, m => this.receiveFromWorker(m));
        }

        return this.defereds[id].promise;
    }

    receiveFromWorker(m: { id: number; message: MessageFromSharedWorker }) {
        this.defereds[m.id].resolve(m.message);
        delete this.defereds[m.id];
    }
}
