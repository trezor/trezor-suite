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
import { TypedEmitter } from '@trezor/utils';

import type {
    EnumerateDoneRequest,
    AcquireIntentRequest,
    AcquireDoneRequest,
    ReleaseIntentRequest,
    ReleaseDoneRequest,
    GetPathBySessionRequest,
    HandleMessageParams,
    HandleMessageResponse,
    SessionsBackgroundInterface,
} from './types';
import type { Descriptor, PathInternal, Success } from '../types';
import { PathPublic, Session } from '../types';
import * as ERRORS from '../errors';

function typedObjectKeys<T extends Record<any, any>>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
}

type DescriptorsDict = Record<PathInternal, Descriptor>;

// in nodeusb, enumeration operation takes ~3 seconds
const lockDuration = 1000 * 4;

export class SessionsBackground
    extends TypedEmitter<{
        /**
         * updated descriptors (session has changed)
         * note: we can't send diff from here (see abstract transport) although it would make sense, because we need to support also bridge which does not use this sessions background.
         */
        descriptors: Descriptor[];
    }>
    implements SessionsBackgroundInterface
{
    /**
     * Dictionary where key is path and value is Descriptor
     */
    private descriptors: DescriptorsDict = {};
    private pathInternalPathPublicMap: Record<PathInternal, PathPublic> = {};

    // if lock is set, somebody is doing something with device. we have to wait
    private locksQueue: { id: ReturnType<typeof setTimeout>; dfd: Deferred<void> }[] = [];
    private lastSessionId = 0;
    private lastPathId = 0;

    public async handleMessage<M extends HandleMessageParams>(
        message: M,
    ): Promise<HandleMessageResponse<M>> {
        let result;

        try {
            // future:
            // once we decide that we want to have sessions synchronization also between browser tabs and
            // desktop application, here should go code that will check if some "master" sessions background
            // is alive (websocket server in suite desktop). If yes, it will simply forward request

            switch (message.type) {
                case 'handshake':
                    result = this.handshake();
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
                    result = this.getPathBySession(message.payload);
                    break;
                case 'dispose':
                    this.dispose();
                    break;
                default:
                    throw new Error(ERRORS.UNEXPECTED_ERROR);
            }

            result = JSON.parse(JSON.stringify({ ...result, id: message.id }));

            return result;
        } catch (err) {
            // if you are running this in a Sharedworker, you will find logs from here in chrome://inspect/#workers
            console.error('Session background error', err);

            // catch unexpected errors and notify client.
            // background should never stay in "hanged" state
            return {
                ...this.error(ERRORS.UNEXPECTED_ERROR),
                id: message.type,
            } as HandleMessageResponse<M>;
        } finally {
            if (result && result.success && result.payload && 'descriptors' in result.payload) {
                const { descriptors } = result.payload;
                setTimeout(() => this.emit('descriptors', Object.values(descriptors)), 0);
            }
        }
    }

    private handshake() {
        return this.success(undefined);
    }

    /**
     * enumerate done
     * - caller informs about current descriptors
     */
    private enumerateDone(payload: EnumerateDoneRequest) {
        const disconnectedDevices = typedObjectKeys(this.descriptors).filter(
            pathInternal => !payload.descriptors.find(d => d.path === pathInternal),
        );

        disconnectedDevices.forEach(d => {
            delete this.descriptors[d];
            delete this.pathInternalPathPublicMap[d];
        });

        payload.descriptors.forEach(d => {
            if (!this.pathInternalPathPublicMap[d.path]) {
                this.pathInternalPathPublicMap[d.path] = PathPublic(`${(this.lastPathId += 1)}`);
            }
            if (!this.descriptors[d.path]) {
                this.descriptors[d.path] = {
                    ...d,
                    path: this.pathInternalPathPublicMap[d.path],
                    session: null,
                };
            }
        });

        return Promise.resolve(
            this.success({
                descriptors: Object.values(this.descriptors),
            }),
        );
    }

    /**
     * acquire intent
     */
    private async acquireIntent(payload: AcquireIntentRequest) {
        const pathInternal = this.getInternal(payload.path);

        if (!pathInternal) {
            return this.error(ERRORS.DESCRIPTOR_NOT_FOUND);
        }

        const previous = this.descriptors[pathInternal]?.session;

        if (payload.previous && payload.previous !== previous) {
            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        if (!this.descriptors[pathInternal]) {
            return this.error(ERRORS.DESCRIPTOR_NOT_FOUND);
        }

        await this.waitInQueue();

        // in case there are 2 simultaneous acquireIntents, one goes through, the other one waits and gets error here
        if (previous !== this.descriptors[pathInternal]?.session) {
            this.clearLock();

            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        // new "unconfirmed" descriptors are  broadcasted. we can't yet update this.sessions object as it needs
        // to stay as it is. we can not allow 2 clients sending session:null to proceed. this way only one gets through
        const unconfirmedSessions: DescriptorsDict = JSON.parse(JSON.stringify(this.descriptors));

        this.lastSessionId++;
        unconfirmedSessions[pathInternal].session = Session(`${this.lastSessionId}`);

        return this.success({
            session: unconfirmedSessions[pathInternal].session,
            path: pathInternal,
            descriptors: Object.values(unconfirmedSessions),
        });
    }

    /**
     * client notified backend that he is able to talk to device
     * - assign client a new "session". this session will be used in all subsequent communication
     */
    private acquireDone(payload: AcquireDoneRequest) {
        this.clearLock();
        const pathInternal = this.getInternal(payload.path);

        if (!pathInternal || !this.descriptors[pathInternal]) {
            return this.error(ERRORS.DESCRIPTOR_NOT_FOUND);
        }
        this.descriptors[pathInternal].session = Session(`${this.lastSessionId}`);

        return Promise.resolve(
            this.success({
                descriptors: Object.values(this.descriptors),
            }),
        );
    }

    private async releaseIntent(payload: ReleaseIntentRequest) {
        const pathResult = this.getPathBySession({ session: payload.session });

        if (!pathResult.success) {
            return pathResult;
        }
        const { path } = pathResult.payload;

        await this.waitInQueue();

        return this.success({ path });
    }

    private releaseDone(payload: ReleaseDoneRequest) {
        this.descriptors[payload.path].session = null;

        this.clearLock();

        return Promise.resolve(this.success({ descriptors: Object.values(this.descriptors) }));
    }

    private getSessions() {
        return Promise.resolve(this.success({ descriptors: Object.values(this.descriptors) }));
    }

    private getPathBySession({ session }: GetPathBySessionRequest) {
        const path = typedObjectKeys(this.descriptors).find(
            pathKey => this.descriptors[pathKey]?.session === session,
        );

        if (!path) {
            return this.error(ERRORS.SESSION_NOT_FOUND);
        }

        return this.success({ path });
    }

    private clearLock() {
        const lock = this.locksQueue[0];
        if (lock) {
            lock.dfd.resolve(undefined);
            clearTimeout(lock.id);
            this.locksQueue.shift();
        }
    }

    private async waitInQueue() {
        // todo: create a deferred with built-in timeout functionality (util)
        const dfd = createDeferred();

        // to ensure that communication with device will not get stuck forever,
        // lock times out:
        // - if cleared by client (enumerateDone)
        // - after n second automatically
        const timeout = setTimeout(dfd.resolve, lockDuration);

        const beforeMe = this.locksQueue.slice();
        this.locksQueue.push({ id: timeout, dfd });

        if (beforeMe.length) {
            await Promise.all(beforeMe.map(lock => lock.dfd.promise));
        }
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

    private getInternal(pathPublic: PathPublic): PathInternal | undefined {
        return typedObjectKeys(this.pathInternalPathPublicMap).find(
            internal => this.pathInternalPathPublicMap[internal] === pathPublic,
        );
    }

    dispose() {
        this.locksQueue.forEach(lock => clearTimeout(lock.id));
        this.descriptors = {};
        this.lastSessionId = 0;
        this.removeAllListeners();
    }
}
