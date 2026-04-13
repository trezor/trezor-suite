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

import { type TimerId } from '@trezor/type-utils';
import { type Deferred, TypedEmitter, createDeferred, typedObjectKeys } from '@trezor/utils';

import type {
    AcquireDoneRequest,
    AcquireIntentRequest,
    EnumerateDoneRequest,
    GetPathBySessionRequest,
    HandleMessageParams,
    HandleMessageResponse,
    ReleaseDoneRequest,
    ReleaseIntentRequest,
    SessionsBackgroundInterface,
} from './types';
import * as ERRORS from '../errors';
import type { Descriptor, PathInternal } from '../types';
import { PathPublic, Session } from '../types';
import { error, success } from '../utils/result';

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
        releaseRequest: Descriptor;
    }>
    implements SessionsBackgroundInterface
{
    /**
     * Dictionary where key is path and value is Descriptor
     */
    private descriptors: DescriptorsDict = {};
    private pathInternalPathPublicMap: Record<PathInternal, PathPublic> = {};

    // Lock queue for exclusive device access. Each entry has a unique token for ownership tracking.
    private locksQueue: { token: number; dfd: Deferred<void> }[] = [];
    private lockIdCounter = 0;
    // Active lock token per device path, persisted between Intent and Done calls.
    private activeLocks = new Map<PathInternal, number>();
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
                ...error({ code: ERRORS.UNEXPECTED_ERROR }),
                id: message.type,
            } as HandleMessageResponse<M>;
        } finally {
            if (result && result.success && result.payload) {
                if ('descriptors' in result.payload) {
                    const { descriptors } = result.payload;
                    this.emit('descriptors', descriptors);
                }
                if ('releaseRequest' in result.payload && result.payload.releaseRequest) {
                    const { releaseRequest } = result.payload;
                    this.emit('releaseRequest', releaseRequest);
                }
            }
        }
    }

    private handshake() {
        return success(undefined);
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
            // Release any active lock held for this device to avoid starvation.
            this.releaseActiveLock(d);
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
                    apiType: d.apiType,
                };
            }
        });

        return Promise.resolve(success({ descriptors: Object.values(this.descriptors) }));
    }

    /**
     * acquire intent
     */
    private async acquireIntent(payload: AcquireIntentRequest) {
        const pathInternal = this.getInternal(payload.path);

        if (!pathInternal) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        const previous = this.descriptors[pathInternal];

        if (!previous) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        if (payload.previous !== previous.session) {
            return error({ code: ERRORS.SESSION_WRONG_PREVIOUS });
        }

        // Snapshot session before waiting so the post-wait check compares against
        // the value at intent time, not the (possibly mutated) current value.
        const previousSession = previous.session;

        const lock = await this.waitInQueue();
        if (!lock) {
            return error({ code: ERRORS.ABORTED_BY_TIMEOUT });
        }

        // In case there are 2 simultaneous acquireIntents, one goes through, the other waits and gets error here.
        if (previousSession !== this.descriptors[pathInternal]?.session) {
            this.clearLock(lock.token);

            return error({ code: ERRORS.SESSION_WRONG_PREVIOUS });
        }

        // Store lock token for this path until acquireDone.
        this.activeLocks.set(pathInternal, lock.token);

        this.lastSessionId++;
        const session = Session(`${this.lastSessionId}`);
        const releaseRequest =
            previous.session !== null ? this.descriptors[pathInternal] : undefined;

        return success({ session, path: pathInternal, releaseRequest });
    }

    /**
     * client notified backend that he is able to talk to device
     * - assign client a new "session". this session will be used in all subsequent communication
     */
    private acquireDone(payload: AcquireDoneRequest) {
        const pathInternal = this.getInternal(payload.path);

        if (!pathInternal || !this.descriptors[pathInternal]) {
            // Release lock on error to avoid starvation.
            if (pathInternal) {
                this.releaseActiveLock(pathInternal);
            }

            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        // When abort is set, just release the lock without modifying session.
        let { session } = this.descriptors[pathInternal];
        if (!payload.abort) {
            session = Session(`${this.lastSessionId}`);
            this.descriptors[pathInternal].session = session;
            this.descriptors[pathInternal].sessionOwner = payload.sessionOwner;
        }

        this.releaseActiveLock(pathInternal);

        return Promise.resolve(success({ session, descriptors: Object.values(this.descriptors) }));
    }

    private async releaseIntent(payload: ReleaseIntentRequest) {
        const pathResult = this.getPathBySession({ session: payload.session });

        if (!pathResult.success) {
            return pathResult;
        }
        const { path } = pathResult.payload;

        const lock = await this.waitInQueue();
        if (!lock) {
            return error({ code: ERRORS.ABORTED_BY_TIMEOUT });
        }

        // Store lock token for this path until releaseDone.
        this.activeLocks.set(path, lock.token);

        return success({ path });
    }

    private releaseDone(payload: ReleaseDoneRequest) {
        try {
            if (!this.descriptors[payload.path]) {
                return error({ code: ERRORS.DEVICE_NOT_FOUND });
            }

            this.descriptors[payload.path].session = null;
            this.descriptors[payload.path].sessionOwner = undefined;

            return Promise.resolve(success({ descriptors: Object.values(this.descriptors) }));
        } finally {
            // Release lock in finally to avoid starvation on error or disconnect.
            this.releaseActiveLock(payload.path);
        }
    }

    private getSessions() {
        return Promise.resolve(success({ descriptors: Object.values(this.descriptors) }));
    }

    private getPathBySession({ session }: GetPathBySessionRequest) {
        const path = typedObjectKeys(this.descriptors).find(
            pathKey => this.descriptors[pathKey]?.session === session,
        );

        if (!path) {
            return error({ code: ERRORS.SESSION_NOT_FOUND });
        }

        return success({ path });
    }

    private startLock(): number {
        this.lockIdCounter++;
        const dfd = createDeferred<void>();
        this.locksQueue.push({ token: this.lockIdCounter, dfd });

        return this.lockIdCounter;
    }

    private clearLock(token: number) {
        const index = this.locksQueue.findIndex(l => l.token === token);
        if (index !== -1) {
            this.locksQueue[index].dfd.resolve(undefined);
            this.locksQueue.splice(index, 1);
        }
    }

    private releaseActiveLock(pathInternal: PathInternal) {
        const token = this.activeLocks.get(pathInternal);
        if (token !== undefined) {
            this.clearLock(token);
            this.activeLocks.delete(pathInternal);
        }
    }

    /**
     * Wait in the lock queue. Returns a lock handle on success, or null if the wait timed out.
     * Timeout is a safety net only; it never transfers ownership to another waiter.
     */
    private async waitInQueue(): Promise<{ token: number } | null> {
        const token = this.startLock();
        const deadline = Date.now() + lockDuration;

        // Wait for predecessors before proceeding. Re-check position after each
        // predecessor resolves in case an earlier waiter timed out and was removed.
        while (true) {
            const myIndex = this.locksQueue.findIndex(l => l.token === token);
            if (myIndex <= 0) {
                break;
            }

            const predecessor = this.locksQueue[myIndex - 1];
            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                this.clearLock(token);

                return null;
            }

            let timeoutId: TimerId;
            const timedOut = await Promise.race([
                predecessor.dfd.promise.then(() => false),
                new Promise<true>(resolve => {
                    timeoutId = setTimeout(() => resolve(true), remaining);
                }),
            ]);
            clearTimeout(timeoutId!);

            if (timedOut) {
                this.clearLock(token);

                return null;
            }
        }

        return { token };
    }

    private getInternal(pathPublic: PathPublic): PathInternal | undefined {
        return typedObjectKeys(this.pathInternalPathPublicMap).find(
            internal => this.pathInternalPathPublicMap[internal] === pathPublic,
        );
    }

    dispose() {
        // Resolve all pending lock deferreds to unblock waiters.
        this.locksQueue.forEach(lock => lock.dfd.resolve(undefined));
        this.locksQueue = [];
        this.activeLocks.clear();
        this.descriptors = {};
        this.lastSessionId = 0;
        this.removeAllListeners();
    }
}
