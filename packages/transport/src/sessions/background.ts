/**
 * Goals:
 * - synchronize exclusive access to device (locks)
 * - ensure device has not changed without other clients realizing (sessions).
 *
 * Concepts:
 * - we have no control about the async process between lock and unlock, it happens elsewhere
 * - caller has the responsibility to lock and unlock
 * - we can say we trust the caller but not really thats why we implement auto-unlock
 */

import { createDeferred, Deferred } from '@trezor/utils';

import { TypedEmitter } from '../types/typed-emitter';

import type {
    EnumerateDoneRequest,
    AcquireIntentRequest,
    // AcquireDoneRequest,
    ReleaseIntentRequest,
    ReleaseDoneRequest,
    GetPathBySessionRequest,
    HandleMessageParams,
    HandleMessageResponse,
    Sessions,
} from './types';
import type { Descriptor, Success } from '../types';

import * as ERRORS from '../errors';

// in nodeusb, enumeration operation takes ~3 seconds
const lockDuration = 1000 * 4;

export class SessionsBackground extends TypedEmitter<{
    ['descriptors']: Descriptor[];
}> {
    /**
     * Dictionary where key is path and value is session
     */
    private sessions: Sessions = {};

    // if lock is set, somebody is doing something with device. we have to wait
    private locksQueue: Deferred<any>[] = [];
    private locksTimeoutQueue: ReturnType<typeof setTimeout>[] = [];

    private lastSession = 1;

    public async handleMessage<M extends HandleMessageParams>(
        message: M,
    ): Promise<HandleMessageResponse<M>> {
        try {
            // future:
            // once we decide that we want to have sessions synchronization also between browser tabs and
            // desktop application, here should go code that will check if some "master" sessions background
            // is alive (websocket server in suite desktop). If yes, it will simply forward request

            let result;

            switch (message.type) {
                case 'handshake':
                    result = this.handshake();
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
                    result = await this.acquireDone();
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
                    result = this.getPathBySession(message.payload);
                    break;
                default:
                    throw new Error(ERRORS.UNEXPECTED_ERROR);
            }

            if (result.success && result.payload && 'descriptors' in result.payload) {
                this.emit('descriptors', result.payload.descriptors);
            }

            return { ...result, id: message.id } as HandleMessageResponse<M>;
        } catch (err) {
            // catch unexpected errors and notify client.
            // background should never stay in "hanged" state
            return {
                ...this.error(ERRORS.UNEXPECTED_ERROR),
                id: message.type,
            } as HandleMessageResponse<M>;
        }
    }

    private handshake() {
        return this.success(undefined);
    }
    /**
     * enumerate intent
     * - caller wants to enumerate usb
     * - basically "wait for unlocked and lock"
     */
    async enumerateIntent() {
        await this.waitInQueue();

        return this.success({ sessions: this.sessions });
    }

    /**
     * enumerate done
     * - caller will not be touching usb anymore
     * - caller informs about disconnected devices so that they may be removed from sessions list
     */
    private enumerateDone(payload: EnumerateDoneRequest) {
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

        return Promise.resolve(
            this.success({
                sessions: this.sessions,
                descriptors: this.sessionsToDescriptors(),
            }),
        );
    }

    /**
     * acquire intent
     * - I would like to claim this device for myself
     * - a] there is another session
     * - b] there is no another session
     */
    private async acquireIntent(payload: AcquireIntentRequest) {
        await this.waitInQueue();

        let error = false;

        const previous = this.sessions[payload.path];

        if (previous == null) {
            error = payload.previous != null;
        } else {
            error = payload.previous !== previous;
        }

        if (payload.previous == null) {
            error = false;
        }

        if (error) {
            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        const id = `${this.getNewSessionId()}`;
        this.sessions[payload.path] = id;

        return Promise.resolve(
            this.success({
                session: this.sessions[payload.path] as string,
                descriptors: this.sessionsToDescriptors(),
            }),
        );
    }

    /**
     * client notified backend that he is able to talk to device
     * - assign client a new "session". this session will be used in all subsequent communication
     */
    private acquireDone() {
        this.clearLock();
        return this.success(undefined);
    }

    /**
     * call intent - I have session
     * - I am going to send something to device and I want to use this session.
     * - a] it is ok, no other session was issued
     * - b] it is not ok, other session was issued
     */
    private async releaseIntent(payload: ReleaseIntentRequest) {
        const path = this._getPathBySession({ session: payload.session });

        if (!path) {
            return this.error(ERRORS.SESSION_NOT_FOUND);
        }

        await this.waitInQueue();

        return this.success({ path });
    }

    private releaseDone(payload: ReleaseDoneRequest) {
        this.sessions[payload.path] = null;

        this.clearLock();

        return Promise.resolve(this.success({ descriptors: this.sessionsToDescriptors() }));
    }

    private getSessions() {
        return Promise.resolve(this.success({ sessions: this.sessions }));
    }

    private getPathBySession({ session }: GetPathBySessionRequest) {
        const path = this._getPathBySession({ session });
        if (!path) {
            return this.error(ERRORS.SESSION_NOT_FOUND);
        }
        return this.success({ path });
    }

    private _getPathBySession({ session }: GetPathBySessionRequest) {
        let path: string | undefined;
        Object.keys(this.sessions).forEach(pathKey => {
            if (this.sessions[pathKey] === session) {
                path = pathKey;
            }
        });
        return path;
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

    private getNewSessionId() {
        return this.lastSession++;
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

    private success<T>(payload: T): Success<T> {
        return {
            success: true as const,
            payload,
        };
    }

    private error<E>(error: E) {
        return {
            success: false as const,
            error,
        };
    }
}
