import * as protobuf from 'protobufjs/light';
import { scheduleAction, ScheduleActionParams, ScheduledAction, Deferred } from '@trezor/utils';
import { TypedEmitter } from '@trezor/node-utils/lib/typedEventEmitter';
import { PROTOCOL_MALFORMED, TransportProtocol } from '@trezor/protocol';
import { MessageFromTrezor } from '@trezor/protobuf';

import {
    Session,
    Descriptor,
    AbortableCall,
    AsyncResultWithTypedError,
    ResultWithTypedError,
    Success,
    AnyError,
    Logger,
} from '../types';
import { success, error, unknownError } from '../utils/result';

import * as ERRORS from '../errors';
import { ACTION_TIMEOUT, TRANSPORT } from '../constants';

export type AcquireInput = {
    path: string;
    previous?: Session;
};

export type ReleaseInput = {
    path: string;
    session: string;
    onClose?: boolean;
};

type DeviceDescriptorDiff = {
    didUpdate: boolean;
    descriptors: Descriptor[];
    connected: Descriptor[];
    disconnected: Descriptor[];
    changedSessions: Descriptor[];
    acquired: Descriptor[];
    acquiredByMyself: Descriptor[];
    acquiredElsewhere: Descriptor[];
    released: Descriptor[];
    releasedByMyself: Descriptor[];
    releasedElsewhere: Descriptor[];
};

export interface AbstractTransportParams {
    messages?: Record<string, any>;
    signal?: AbortSignal;
    logger?: Logger;
}

export const isTransportInstance = (transport?: AbstractTransport) => {
    const requiredMethods = [
        'init',
        'enumerate',
        'listen',
        'acquire',
        'release',
        'send',
        'receive',
        'call',
    ] as const;

    if (transport && typeof transport === 'object') {
        return !requiredMethods.some(m => typeof transport[m] !== 'function');
    }
    return false;
};

export abstract class AbstractTransport extends TypedEmitter<{
    [TRANSPORT.UPDATE]: DeviceDescriptorDiff;
    [TRANSPORT.ERROR]:
        | typeof ERRORS.HTTP_ERROR // most common error - bridge was killed
        // probably never happens, wrong shape of data came from bridge
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.UNEXPECTED_ERROR;
}> {
    public abstract name:
        | 'BridgeTransport'
        | 'NodeUsbTransport'
        | 'WebUsbTransport'
        | 'UdpTransport';
    /**
     * transports with "external element" such as bridge can be outdated.
     */
    public isOutdated = false;
    /**
     * transports with "external element" such as bridge can have version.
     */
    public version = '';
    /**
     * once transport has been stopped, it does not emit any events
     */
    protected stopped = false;
    /**
     * once transport is listening, it will be emitting TRANSPORT.UPDATE events
     */
    protected listening = false;
    protected messages: protobuf.Root;
    /**
     * minimal data to track device on transport layer
     */
    protected descriptors: Descriptor[];
    /**
     * when calling acquire, after it resolves successfully, we store the result (session)
     * and wait for next descriptors update (/listen in case of bridge or 'descriptors' message from sessions background)
     * and compare it with acquiringSession. Typically both values would equal but in certain edgecases
     * another application might have acquired session right after this application which means that
     * the originally received session is not longer valid and device is used by another application
     */
    protected acquiredUnconfirmed: Record<string, string> = {};
    /**
     * promise that resolves on when next descriptors are delivered
     */
    protected listenPromise: Record<
        string,
        Deferred<
            ResultWithTypedError<
                string,
                | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
                | typeof ERRORS.SESSION_WRONG_PREVIOUS
                | typeof ERRORS.DEVICE_NOT_FOUND
                | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
                | typeof ERRORS.UNEXPECTED_ERROR
                | typeof ERRORS.ABORTED_BY_TIMEOUT
                | typeof ERRORS.ABORTED_BY_SIGNAL
            >
        >
    > = {};

    /**
     * used to postpone resolving of transport.release until next descriptors are delivered
     */
    protected releasePromise?: Deferred<any>;
    protected releasingSession: string | undefined;

    /**
     * each transport class accepts signal parameter in constructor and implements it's own abort controller.
     * whenever signal event is fired, transport passes this down by aborting its own abort controller.
     */
    protected abortController: AbortController;
    /**
     * and instance of logger from @trezor/connect/src/utils/debug could be passed to activate logs from transport
     */
    protected logger: Logger;

    constructor(params?: AbstractTransportParams) {
        const { messages, signal, logger } = params || {};

        super();
        this.descriptors = [];
        this.messages = protobuf.Root.fromJSON(messages || {});

        this.abortController = new AbortController();

        if (signal) {
            const abort = () => this.abortController.abort();
            this.abortController.signal.addEventListener('abort', () =>
                signal.removeEventListener('abort', abort),
            );
            signal.addEventListener('abort', abort);
        }

        // some abstract inactive logger
        this.logger = logger || {
            debug: (..._args: string[]) => {},
            log: (..._args: string[]) => {},
            warn: (..._args: string[]) => {},
            error: (..._args: string[]) => {},
        };
    }

    /**
     * Tries to initiate transport. Transport might not be available e.g. bridge not running.
     */
    abstract init(): AbortableCall<
        undefined,
        // webusb only
        | typeof ERRORS.SESSION_BACKGROUND_TIMEOUT
        | typeof ERRORS.WRONG_ENVIRONMENT
        // bridge only
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.HTTP_ERROR
        // bridge + webusb
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
    >;

    /**
     * Setup listeners for device changes (connect, disconnect, change?).
     * What should it do? Will start emitting DEVICE events after this is fired?
     * - should call onDescriptorsUpdated in the end
     */

    abstract listen(): ResultWithTypedError<
        undefined,
        typeof ERRORS.ALREADY_LISTENING | typeof ERRORS.WRONG_ENVIRONMENT
    >;

    /**
     * List Trezor devices
     */
    abstract enumerate(): AbortableCall<
        Descriptor[],
        | typeof ERRORS.HTTP_ERROR
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.WRONG_ENVIRONMENT
    >;

    /**
     * Acquire session
     */
    abstract acquire({ input }: { input: AcquireInput }): AbortableCall<
        string,
        // webusb
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        // bridge
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.HTTP_ERROR
        // webusb + bridge
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.SESSION_WRONG_PREVIOUS
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.WRONG_ENVIRONMENT
    >;

    /**
     * Release session
     */
    abstract release({ path, session, onClose }: ReleaseInput): AbortableCall<
        void,
        | typeof ERRORS.SESSION_NOT_FOUND
        // bridge
        | typeof ERRORS.HTTP_ERROR
        | typeof ERRORS.WRONG_RESULT_TYPE
        // webusb + bridge
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.SESSION_WRONG_PREVIOUS
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.WRONG_ENVIRONMENT
    >;

    /**
     * Release device
     * This does nothing for transports using "external element" such as bridge
     * For transports with native access (webusb), this informs lower transport layer
     * that device is not going to be used anymore
     */
    abstract releaseDevice(path: string): AsyncResultWithTypedError<void, string>;

    /**
     * Encode data and write it to transport layer
     */
    abstract send(params: {
        path?: string;
        session: string;
        name: string;
        data: Record<string, unknown>;
        protocol?: TransportProtocol;
    }): AbortableCall<
        undefined,
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        // bridge
        | typeof ERRORS.HTTP_ERROR
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
        // webusb + bridge
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.SESSION_NOT_FOUND
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.WRONG_ENVIRONMENT
    >;

    /**
     * Only read from transport
     */
    abstract receive(params: {
        path?: string;
        session: string;
        protocol?: TransportProtocol;
    }): AbortableCall<
        MessageFromTrezor,
        // bridge
        | typeof ERRORS.HTTP_ERROR
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
        // webusb + bridge
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.SESSION_NOT_FOUND
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.WRONG_ENVIRONMENT
    >;

    /**
     * Send and read after that
     */
    abstract call(params: {
        session: string;
        name: string;
        data: Record<string, unknown>;
        protocol?: TransportProtocol;
    }): AbortableCall<
        MessageFromTrezor,
        // bridge
        | typeof ERRORS.HTTP_ERROR
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
        // webusb + bridge
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.WRONG_ENVIRONMENT
        // webusb
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
    >;

    /**
     * Stop transport = remove all listeners + try to release session + cancel all requests
     */
    abstract stop(): void;

    private getDiff(nextDescriptors: Descriptor[]): DeviceDescriptorDiff {
        const connected = nextDescriptors.filter(
            nextDescriptor =>
                !this.descriptors.find(descriptor => descriptor.path === nextDescriptor.path),
        );
        const disconnected = this.descriptors.filter(
            d => nextDescriptors.find(x => x.path === d.path) === undefined,
        );
        const changedSessions = nextDescriptors.filter(d => {
            const currentDescriptor = this.descriptors.find(x => x.path === d.path);
            if (currentDescriptor) {
                return currentDescriptor.session !== d.session;
            }
            return false;
        });

        const acquired = changedSessions.filter(d => typeof d.session === 'string');
        const acquiredByMyself = acquired.filter(
            d => d.session === this.acquiredUnconfirmed[d.path],
        );
        const acquiredElsewhere = acquired.filter(
            d => d.session !== this.acquiredUnconfirmed[d.path],
        );

        const released = changedSessions.filter(d => typeof d.session !== 'string');
        const releasedByMyself = released.filter(
            d =>
                this.descriptors.find(prevD => prevD.path === d.path)?.session ===
                this.releasingSession,
        );
        const releasedElsewhere = released.filter(
            d =>
                this.descriptors.find(prevD => prevD.path === d.path)?.session !==
                this.releasingSession,
        );

        const didUpdate = connected.length + disconnected.length + changedSessions.length > 0;

        return {
            connected,
            disconnected,
            // changedSessions is superset of acquired
            changedSessions,
            // acquired is acquiredByMyself + acquiredElsewhere
            acquired,
            acquiredByMyself,
            acquiredElsewhere,

            released,
            releasedByMyself,
            releasedElsewhere,
            didUpdate,
            descriptors: nextDescriptors,
        };
    }

    /**
     * common method for all types of transports. should be called whenever descriptors change:
     * - after enumeration (new descriptors without session)
     * - after acquire (some descriptor changed session number)
     * - after release (some descriptor changed session number)
     */
    handleDescriptorsChange(nextDescriptors: Descriptor[]) {
        if (this.stopped) {
            return;
        }
        const diff = this.getDiff(nextDescriptors);
        this.logger.debug('nextDescriptors', nextDescriptors, 'diff', diff);

        if (!diff.didUpdate) {
            return;
        }

        this.descriptors = nextDescriptors;

        Object.keys(this.listenPromise).forEach(path => {
            const descriptor = nextDescriptors.find(device => device.path === path);

            if (!descriptor) {
                return this.listenPromise[path].resolve(
                    this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION }),
                );
            }

            if (this.acquiredUnconfirmed[path]) {
                const reportedNextSession = descriptor.session;
                if (reportedNextSession === this.acquiredUnconfirmed[path]) {
                    this.listenPromise[path].resolve(this.success(this.acquiredUnconfirmed[path]));
                } else {
                    // another app took over
                    this.listenPromise[path].resolve(
                        this.error({ error: ERRORS.SESSION_WRONG_PREVIOUS }),
                    );
                }
                delete this.acquiredUnconfirmed[path];
            } else if (this.releasingSession) {
                this.listenPromise[path].resolve(this.success('null'));
            } else {
                // listen reported changes but we were not expecting any (no acquire or release in progress)
                // this means that another application acquired session
                this.listenPromise[path].resolve(
                    this.error({ error: ERRORS.SESSION_WRONG_PREVIOUS }),
                );
            }
        });

        this.emit(TRANSPORT.UPDATE, diff);
        this.releasingSession = undefined;
    }

    /**
     * Check if protobuf message is present in protobuf.Root
     * default: GetFeatures - this message should be always present.
     */
    public getMessage(message = 'GetFeatures') {
        return !!this.messages.get(message);
    }

    public updateMessages(messages: Record<string, any>) {
        this.messages = protobuf.Root.fromJSON(messages);
    }

    protected success<T>(payload: T): Success<T> {
        return success(payload);
    }

    protected error<E extends AnyError>(payload: { error: E; message?: string }) {
        return error<E>(payload);
    }

    protected unknownError = <E extends AnyError>(err: Error | string, expectedErrors: E[]) => {
        this.logger.error(this.name, 'unexpected error: ', err);
        return unknownError(typeof err !== 'string' ? err : new Error(err), expectedErrors);
    };

    /**
     * Create a new instance of AbortController which is also aborted by global AbortController
     */
    private createLocalAbortController = () => {
        const localAbortController = new AbortController();
        const abort = () => localAbortController.abort();
        localAbortController.signal.addEventListener('abort', () => {
            this.abortController.signal.removeEventListener('abort', abort);
        });
        this.abortController.signal.addEventListener('abort', abort);
        return { signal: localAbortController.signal, abort };
    };

    protected scheduleAction = <T, E extends AnyError>(
        action: ScheduledAction<T>,
        params?: ScheduleActionParams,
        errors?: E[],
    ) => {
        const { signal, abort } = this.createLocalAbortController();
        return {
            promise: scheduleAction(action, {
                signal,
                timeout: ACTION_TIMEOUT,
                ...params,
            })
                .catch(err => {
                    const expectedErrors = [ERRORS.ABORTED_BY_TIMEOUT, ERRORS.ABORTED_BY_SIGNAL];
                    if (errors) {
                        (expectedErrors as E[]).push(...errors);
                    }
                    return unknownError(err, expectedErrors);
                })
                .finally(() => {
                    this.abortController.signal.removeEventListener('abort', abort);
                }),
            abort,
        };
    };
}

export type AbstractTransportMethodParams<K extends keyof AbstractTransport> =
    AbstractTransport[K] extends (...args: any[]) => any
        ? Parameters<AbstractTransport[K]>[0]
        : never;
