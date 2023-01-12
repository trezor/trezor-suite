/**
 * Goals:
 * - synchronize exclusive access to device (locks)
 * - ensure device has not changed without other clients realizing (sessions).
 *
 * Concepts:
 * - we have no control about the async process between lock and unlock, it happens elsewhere
 * - caller has the responsibility to lock and unlock
 * - we can say we trust the caller but not really
 * - auto time out of any lock, so we don't want to get stuck. TODO: does it make sense, if we trust the caller?
 *
 * - TODOS: I am not convinced about API it has now, two possible approaches
 * - API knows concepts of transport (enumerate, acquire)
 * - API does not know. Will rather have methods such as "lock", "unlock", "getSessions", "setSessions"
 */

import { createDeferred, Deferred } from '@trezor/utils';

import {
    EnumerateDone,
    AcquireIntent,
    AcquireDone,
    ReleaseIntent,
    ReleaseDone,
    GetPathBySession,
} from './types';
import { TypedEmitter } from '../types/typed-emitter';
import type { Session, Descriptor } from '../types';

import { ClientRequest } from './client';
import * as ERRORS from '../errors';

type Sessions = Record<string, Session | undefined>;

let id = 0;

// in nodeusb, enumeration operation takes ~3 seconds
const lockDuration = 1000 * 4;

export class SessionsBackground extends TypedEmitter<{
    ['descriptors']: Descriptor[];
}> {
    // response method responsible for notifying all clients
    private sessions: Sessions = {};

    // if lock is set, somebody is doing something with device. we have to wait
    private locksQueue: Deferred<any>[] = [];
    private locksTimeoutQueue: ReturnType<typeof setTimeout>[] = [];

    private last = 1;

    // todo: types
    async handleMessage(message: Parameters<ClientRequest>[0]) {
        try {
            id++;
            console.log(
                '-> [backend]',
                id,
                message.type,
                'payload ',
                JSON.stringify(message),
                'sessions',
                JSON.stringify(this.sessions),
            );
            console.time(`${id}`);

            // future:
            // once we decide that we want to have sessions synchronization also between browser tabs and
            // desktop application, here should go code that will check if some "master" sessions background
            // is alive (websocket server in suite desktop). If yes, it will simply forward request

            let result: any;
            switch (message.type) {
                case 'handshake':
                    result = await this.handshake();
                    break;
                case 'enumerateIntent':
                    result = await this.enumerateIntent();
                    break;
                case 'enumerateDone':
                    result = await this.enumerateDone(message.payload);
                    break;
                case 'acquireIntent':
                    result = await this.acquireIntent(message.payload);
                    break;
                case 'acquireDone':
                    result = await this.acquireDone(message.payload);
                    break;
                case 'getSessions':
                    result = await this.getSessions();
                    break;
                case 'releaseIntent':
                    result = await this.releaseIntent(message.payload);
                    break;
                case 'releaseDone':
                    result = await this.releaseDone(message.payload);
                    break;
                case 'getPathBySession':
                    result = await this.getPathBySession(message.payload);
                    break;
                default:
                    // @ts-expect-error type-safe -> should not happen
                    console.error('case not handled', message.type);
            }
            console.log(
                '<- [backend]: with: ',
                id,
                message.type,
                ' ',
                JSON.stringify(result),
                'sessions: ',
                JSON.stringify(this.sessions),
            );
            console.timeEnd(`${id}`);

            if (result && 'descriptors' in result) {
                setTimeout(() => {
                    this.emit('descriptors', result.descriptors);
                }, 1);
            }
            return { ...result, originalType: message.type };
        } catch (err) {
            // catch unexpected (typically programmers) errors and notify client.
            // backround should never stay in "hanged" state

            // todo: an error message to client
            console.log(err);
        }
    }

    handshake() {
        return { type: 'ack' };
    }
    /**
     * enumerate intent
     * - caller wants to enumerate usb
     * - basically "wait for unlocked and lock"
     */
    async enumerateIntent() {
        await this.waitInQueue();

        return { type: 'ack', sessions: this.sessions };
    }

    /**
     * enumerate done
     * - caller will not be touching usb anymore
     * - caller informs about disconnected devices so that they may be removed from sessions list
     */
    enumerateDone(payload: EnumerateDone) {
        this.clearLock();
        const disconnectedDevices = this.filterDisconnectedDevices(
            this.sessionsToDescriptors(),
            payload.paths,
        );
        disconnectedDevices.forEach(d => {
            delete this.sessions[d.path];
        });

        payload.paths.forEach(d => {
            if (!this.sessions[d]) {
                this.sessions[d] = undefined;
            }
        });

        return Promise.resolve({
            type: 'ack',
            sessions: this.sessions,
            descriptors: this.sessionsToDescriptors(),
        });
    }

    /**
     * acquire intent
     * - I would like to claim this device for myself
     * - a] there is another session
     * - b] there is no another session
     */
    async acquireIntent(payload: AcquireIntent) {
        await this.waitInQueue();

        let error = false;

        const realPrevious = this.sessions[payload.path];

        if (realPrevious == null) {
            error = payload.previous != null;
        } else {
            error = payload.previous !== realPrevious;
        }

        if (payload.previous == null) {
            error = false;
        }

        if (error) {
            return { type: 'nope', reason: ERRORS.WRONG_PREVIOUS_SESSION };
        }

        return { type: 'ack' };
    }

    /**
     * client notified backend that he is able to talk to device
     * - assign client a new "session". this session will be used in all subsequent communication
     */
    acquireDone(payload: AcquireDone) {
        this.clearLock();
        this.sessions[payload.path] = `${this.getId()}`;

        return Promise.resolve({
            type: 'ack',
            session: this.sessions[payload.path],
            descriptors: this.sessionsToDescriptors(),
        });
    }

    /**
     * call intent - I have session
     * - I am going to send something to device and I want to use this session.
     * - a] it is ok, no other session was issued
     * - b] it is not ok, other session was issued
     */
    async releaseIntent(payload: ReleaseIntent) {
        const path = this._getPathBySession({ session: payload.session });

        if (!path) {
            return {
                type: 'nope',
                reason: ERRORS.SESSION_NOT_FOUND,
            };
        }

        await this.waitInQueue();

        return { type: 'ack', path };
    }

    releaseDone(payload: ReleaseDone) {
        this.sessions[payload.path] = null;

        this.clearLock();

        return Promise.resolve({ type: 'ack', descriptors: this.sessionsToDescriptors() });
    }

    getSessions() {
        return Promise.resolve({ type: 'ack', sessions: this.sessions });
    }

    _getPathBySession({ session }: GetPathBySession) {
        let path: string | undefined;
        Object.keys(this.sessions).forEach(_path => {
            if (this.sessions[_path] === session) {
                path = _path;
            }
        });
        return path;
    }

    getPathBySession({ session }: GetPathBySession) {
        return Promise.resolve({ type: 'ack', path: this._getPathBySession({ session }) });
    }

    private startLock() {
        // todo: create a deferred with built-in timeout functionality (util)
        const dfd = createDeferred<any>();

        // to ensure that communication with device will not get stuck forever,
        // lock times out:
        // - if cleared by client (enumerateIntent, enumerateDone)
        // - after n second automatically
        const timeout = setTimeout(() => {
            console.error('[backend]: resolving lock after timeout! should not happen');
            dfd.resolve(undefined);
        }, lockDuration);

        this.locksQueue.push(dfd);
        this.locksTimeoutQueue.push(timeout);

        return this.locksQueue.length - 1;
    }

    private clearLock() {
        const lock = this.locksQueue[0];
        if (lock) {
            this.locksQueue[0].resolve(undefined);
            this.locksQueue.shift();
            clearTimeout(this.locksTimeoutQueue[0]);
            this.locksTimeoutQueue.shift();
        } else {
            // should never happen if implemented correctly by all clients
            console.warn('empty lock queue');
        }
    }

    private async waitForUnlocked(myIndex: number) {
        if (myIndex > 0) {
            const beforeMe = this.locksQueue.slice(0, myIndex);
            if (beforeMe.length) {
                await Promise.all(beforeMe.map(dfd => dfd.promise));
            }
        }
    }

    private async waitInQueue() {
        const myIndex = this.startLock();
        await this.waitForUnlocked(myIndex);
    }

    private getId() {
        return this.last++;
    }

    private sessionsToDescriptors(): Descriptor[] {
        return Object.entries(this.sessions).map(obj => ({
            path: obj[0],
            session: obj[1],
        }));
    }

    private filterDisconnectedDevices(prevDevices: Descriptor[], paths: string[]) {
        return prevDevices.filter(d => !paths.find(p => d.path === p));
    }
}
