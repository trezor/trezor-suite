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

import { TypedEmitter } from '@trezor/utils';

import type {
    EnumerateDoneRequest,
    AcquireIntentRequest,
    AcquireDoneRequest,
    ReleaseDoneRequest,
    GetPathBySessionRequest,
    HandleMessageParams,
    HandleMessageResponse,
    Sessions,
} from './types';
import type { Descriptor, Success } from '../types';

import * as ERRORS from '../errors';

export class SessionsBackground extends TypedEmitter<{
    /**
     * updated descriptors (session has changed)
     * note: we can't send diff from here (see abstract transport) although it would make sense, because we need to support also bridge which does not use this sessions background.
     */
    descriptors: Descriptor[];
}> {
    /**
     * Dictionary where key is path and value is Descriptor
     */
    private descriptors: Sessions = {};

    private lastSessionId = 0;

    constructor() {
        super();
    }

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
                case 'releaseDone':
                    result = await this.releaseDone(message.payload);
                    break;
                case 'getPathBySession':
                    result = this.getPathBySession(message.payload);
                    break;
                default:
                    throw new Error(ERRORS.UNEXPECTED_ERROR);
            }

            result = JSON.parse(JSON.stringify({ ...result, id: message.id }));

            return result;
        } catch (err) {
            // catch unexpected errors and notify client.
            // background should never stay in "hanged" state
            return {
                ...this.error(ERRORS.UNEXPECTED_ERROR),
                id: message.type,
            } as HandleMessageResponse<M>;
        } finally {
            if (result && result.success && result.payload && 'descriptors' in result.payload) {
                const { descriptors } = result.payload;
                setTimeout(() => this.emit('descriptors', Object.values(descriptors)));
            }
        }
    }

    private handshake() {
        return this.success(undefined);
    }

    /**
     * enumerate done
     * - caller will not be touching usb anymore
     * - caller informs about disconnected devices so that they may be removed from sessions list
     */
    private enumerateDone(payload: EnumerateDoneRequest) {
        const disconnectedDevices = this.filterDisconnectedDevices(
            Object.values(this.descriptors),
            payload.descriptors.map(d => d.path), // which paths are occupied paths after last interface read
        );

        disconnectedDevices.forEach(d => {
            delete this.descriptors[d.path];
        });

        payload.descriptors.forEach(d => {
            if (!this.descriptors[d.path]) {
                this.descriptors[d.path] = { ...d, session: null };
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
        const previous = this.descriptors[payload.path]?.session;

        if (payload.previous && payload.previous !== previous) {
            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        if (!this.descriptors[payload.path]) {
            return this.error(ERRORS.DESCRIPTOR_NOT_FOUND);
        }

        // in case there are 2 simultaneous acquireIntents, one goes through, the other one waits and gets error here
        if (previous !== this.descriptors[payload.path]?.session) {
            return this.error(ERRORS.SESSION_WRONG_PREVIOUS);
        }

        // new "unconfirmed" descriptors are  broadcasted. we can't yet update this.sessions object as it needs
        // to stay as it is. we can not allow 2 clients sending session:null to proceed. this way only one gets through
        const unconfirmedSessions: Sessions = JSON.parse(JSON.stringify(this.descriptors));

        this.lastSessionId++;
        const id = `${this.lastSessionId}`;
        unconfirmedSessions[payload.path].session = id;

        return this.success({
            session: id,
            descriptors: Object.values(unconfirmedSessions),
        });
    }

    /**
     * client notified backend that he is able to talk to device
     * - assign client a new "session". this session will be used in all subsequent communication
     */
    private acquireDone(payload: AcquireDoneRequest) {
        if (!this.descriptors[payload.path]) {
            return this.error(ERRORS.DESCRIPTOR_NOT_FOUND);
        }
        this.descriptors[payload.path].session = this.lastSessionId.toString();

        return Promise.resolve(
            this.success({
                descriptors: Object.values(this.descriptors),
            }),
        );
    }

    private releaseDone(payload: ReleaseDoneRequest) {
        this.descriptors[payload.path].session = null;

        return Promise.resolve(this.success({ descriptors: Object.values(this.descriptors) }));
    }

    private getSessions() {
        return Promise.resolve(this.success({ descriptors: Object.values(this.descriptors) }));
    }

    private getPathBySession({ session }: GetPathBySessionRequest) {
        const path = this.getPathFromSessions({ session });
        if (!path) {
            return this.error(ERRORS.SESSION_NOT_FOUND);
        }

        return this.success({ path });
    }

    private getPathFromSessions({ session }: GetPathBySessionRequest) {
        let path: string | undefined;
        Object.keys(this.descriptors).forEach(pathKey => {
            if (this.descriptors[pathKey]?.session === session) {
                path = pathKey;
            }
        });

        return path;
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
