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

import { TimerId } from '@trezor/type-utils';
import { Deferred, TypedEmitter, createDeferred, typedObjectKeys } from '@trezor/utils';
import { WebsocketClient, WebsocketResponse } from '@trezor/websocket-client';

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
import type { Descriptor, PathInternal, Success } from '../types';
import { PathPublic, Session } from '../types';

type DescriptorsDict = Record<PathInternal, Descriptor>;

type WebsocketSessionsEvents = {
    'sessions-descriptors': Descriptor[];
    'sessions-releaseRequest': Descriptor;
};

/**
 * WebSocket client that handles sessions-specific server-initiated events.
 * Extends WebsocketClient to emit custom events for sessions updates.
 */
class SessionsWebsocketClient extends WebsocketClient<WebsocketSessionsEvents> {
    protected onMessage(message: WebsocketResponse) {
        try {
            const data = JSON.parse(message.toString());

            // Handle server-initiated events (no RPC id field)
            if (!data.id && data.type) {
                switch (data.type) {
                    case 'sessions-descriptors':
                        this.emit('sessions-descriptors', data.payload);
                        return;
                    case 'sessions-releaseRequest':
                        this.emit('sessions-releaseRequest', data.payload);
                        return;
                }
            }

            // Fall through to default RPC response handling
            super.onMessage(message);
        } catch (error) {
            // If parsing fails, let parent handle it
            super.onMessage(message);
        }
    }
}

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

    // if lock is set, somebody is doing something with device. we have to wait
    private locksQueue: { id: TimerId; dfd: Deferred<void> }[] = [];
    private locksTimeoutQueue: TimerId[] = [];
    private lastSessionId = 0;
    private lastPathId = 0;

    // WebSocket proxy support
    private wsClient?: SessionsWebsocketClient;
    private wsUrl?: string;

    constructor(wsUrl?: string) {
        super();
        if (wsUrl) {
            this.wsUrl = wsUrl;
            this.initializeWebSocket();
        }
    }

    /**
     * Expose lightweight debug info for diagnostics.
     * (Intentionally read-only snapshot; does not leak private mutable state.)
     */
    public getDebugInfo() {
        return {
            wsUrl: this.wsUrl,
            wsConnected: this.wsClient?.isConnected() ?? false,
            descriptorsCount: Object.keys(this.descriptors).length,
            lastSessionId: this.lastSessionId,
            locksQueueSize: this.locksQueue.length,
            descriptors: Object.values(this.descriptors).map(d => ({
                path: d.path,
                session: d.session,
                sessionOwner: d.sessionOwner,
            })),
        };
    }

    /**
     * Initialize WebSocket connection.
     * Runs asynchronously in the background. WebsocketClient handles reconnection automatically via keepAlive.
     */
    private async initializeWebSocket() {
        if (!this.wsUrl) return;

        try {
            this.wsClient = new SessionsWebsocketClient({
                url: this.wsUrl,
                timeout: 20000,
                pingTimeout: 50000,
                keepAlive: true, // Automatic reconnection handled by base class
            });

            // Forward server events to local listeners
            this.wsClient.on('sessions-descriptors', descriptors => {
                this.emit('descriptors', descriptors);
            });
            this.wsClient.on('sessions-releaseRequest', descriptor => {
                this.emit('releaseRequest', descriptor);
            });

            await this.wsClient.connect();
        } catch (error) {
            // WebSocket not available initially, will use local mode
            // keepAlive in WebsocketClient will handle reconnection automatically
        }
    }

    public async handleMessage<M extends HandleMessageParams>(
        message: M,
    ): Promise<HandleMessageResponse<M>> {
        let result;
        const isWsConnected = this.wsClient?.isConnected() ?? false;

        try {
            // Always execute locally to keep state in sync
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

            // If WebSocket is connected, also send to remote server (fire and forget)
            // This keeps the remote server in sync but we use local result
            if (isWsConnected) {
                const method = `sessions.${message.type}`;
                const params = 'payload' in message ? [message.payload] : [];

                this.wsClient
                    ?.sendMessage({
                        method,
                        params,
                    })
                    .catch(() => {
                        // Ignore errors - local state is authoritative and already returned
                        // Server will re-sync when client reconnects
                    });
            }

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
            // Only emit events when WebSocket is NOT connected (local mode)
            // When WebSocket is connected, server will broadcast events to all clients
            if (!isWsConnected && result && result.success && result.payload) {
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
                    apiType: d.apiType,
                };
            }
        });

        return Promise.resolve(this.success({ descriptors: Object.values(this.descriptors) }));
    }

    /**
     * acquire intent
     */
    private async acquireIntent(payload: AcquireIntentRequest) {
        const pathInternal = this.getInternal(payload.path);

        if (!pathInternal) {
            return this.error(ERRORS.DEVICE_NOT_FOUND);
        }

        const previous = this.descriptors[pathInternal];

        if (!previous) {
            return this.error(ERRORS.DEVICE_NOT_FOUND);
        }

        if (payload.previous !== previous.session) {
            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        await this.waitInQueue();

        // in case there are 2 simultaneous acquireIntents, one goes through, the other one waits and gets error here
        if (previous.session !== this.descriptors[pathInternal]?.session) {
            this.clearLock();

            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        this.lastSessionId++;
        const session = Session(`${this.lastSessionId}`);
        const releaseRequest =
            previous.session !== null ? this.descriptors[pathInternal] : undefined;

        return this.success({ session, path: pathInternal, releaseRequest });
    }

    /**
     * client notified backend that he is able to talk to device
     * - assign client a new "session". this session will be used in all subsequent communication
     */
    private acquireDone(payload: AcquireDoneRequest) {
        this.clearLock();
        const pathInternal = this.getInternal(payload.path);

        if (!pathInternal || !this.descriptors[pathInternal]) {
            return this.error(ERRORS.DEVICE_NOT_FOUND);
        }
        this.descriptors[pathInternal].session = Session(`${this.lastSessionId}`);
        this.descriptors[pathInternal].sessionOwner = payload.sessionOwner;

        return Promise.resolve(this.success({ descriptors: Object.values(this.descriptors) }));
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
        this.descriptors[payload.path].sessionOwner = undefined;

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

    private startLock() {
        // todo: create a deferred with built-in timeout functionality (util)
        const dfd = createDeferred();

        // to ensure that communication with device will not get stuck forever,
        // lock times out:
        // - if cleared by client (enumerateDone)
        // - after n second automatically
        const timeout = setTimeout(() => {
            dfd.resolve(undefined);
        }, lockDuration);

        this.locksQueue.push({ id: timeout, dfd });
        this.locksTimeoutQueue.push(timeout);

        return this.locksQueue.length - 1;
    }

    private clearLock() {
        const lock = this.locksQueue[0];
        if (lock) {
            this.locksQueue[0].dfd.resolve(undefined);
            this.locksQueue.shift();
            clearTimeout(this.locksTimeoutQueue[0]);
            this.locksTimeoutQueue.shift();
        }
    }

    private async waitForUnlocked(myIndex: number) {
        if (myIndex > 0) {
            const beforeMe = this.locksQueue.slice(0, myIndex);
            if (beforeMe.length) {
                await Promise.all(beforeMe.map(lock => lock.dfd.promise));
            }
        }
    }

    private async waitInQueue() {
        const myIndex = this.startLock();
        await this.waitForUnlocked(myIndex);
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
        // Clean up WebSocket
        if (this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = undefined;
        }

        // Clean up local state
        this.locksQueue.forEach(lock => clearTimeout(lock.id));
        this.locksTimeoutQueue.forEach(timeout => clearTimeout(timeout));
        this.descriptors = {};
        this.lastSessionId = 0;
        this.removeAllListeners();
    }
}
