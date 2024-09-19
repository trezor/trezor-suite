import * as protobuf from 'protobufjs/light';
import {
    arrayPartition,
    scheduleAction,
    ScheduleActionParams,
    ScheduledAction,
    Deferred,
} from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils';
import { PROTOCOL_MALFORMED, TransportProtocol } from '@trezor/protocol';
import { MessageFromTrezor } from '@trezor/protobuf';

import {
    Session,
    Descriptor,
    AbortableParam,
    AsyncResultWithTypedError,
    ResultWithTypedError,
    Success,
    AnyError,
    Logger,
    PathPublic,
} from '../types';
import { success, error, unknownError } from '../utils/result';

import * as ERRORS from '../errors';
import { ACTION_TIMEOUT, TRANSPORT } from '../constants';

export type AcquireInput = {
    path: PathPublic;
    previous: Session | null;
};

export type ReleaseInput = {
    path: PathPublic;
    session: Session;
    onClose?: boolean;
};

export type DeviceDescriptorDiff = { descriptor: Descriptor } & (
    | { type: 'connected' | 'disconnected' }
    | {
          type: 'acquired' | 'released';
          subtype: 'here' | 'elsewhere';
      }
);

export interface AbstractTransportParams {
    messages?: Record<string, any>;
    logger?: Logger;
    debugLink?: boolean;
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

const getKey = ({ path, product }: Descriptor) => `${path}${product}`;

type ReadWriteError =
    | typeof ERRORS.HTTP_ERROR
    | typeof ERRORS.WRONG_RESULT_TYPE
    | typeof ERRORS.OTHER_CALL_IN_PROGRESS
    | typeof PROTOCOL_MALFORMED
    | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
    | typeof ERRORS.UNEXPECTED_ERROR
    | typeof ERRORS.SESSION_NOT_FOUND
    | typeof ERRORS.ABORTED_BY_TIMEOUT
    | typeof ERRORS.ABORTED_BY_SIGNAL
    | typeof ERRORS.WRONG_ENVIRONMENT
    | typeof ERRORS.DEVICE_NOT_FOUND
    | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
    | typeof ERRORS.INTERFACE_DATA_TRANSFER;

class TransportEmitter extends TypedEmitter<{
    [TRANSPORT.UPDATE]: DeviceDescriptorDiff;
    [TRANSPORT.ERROR]:
        | typeof ERRORS.HTTP_ERROR // most common error - bridge was killed
        // probably never happens, wrong shape of data came from bridge
        | typeof ERRORS.WRONG_RESULT_TYPE
        | typeof ERRORS.UNEXPECTED_ERROR;
}> {}

export abstract class AbstractTransport extends TransportEmitter {
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
    protected stopped = true;
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
    protected acquiredUnconfirmed: Record<string, Session> = {};
    /**
     * promise that resolves on when next descriptors are delivered
     */
    protected listenPromise: Record<
        string,
        Deferred<
            ResultWithTypedError<
                Session,
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
    protected releaseUnconfirmed: Record<string, Session> = {};

    /**
     * each transport class accepts signal parameter in constructor and implements it's own abort controller.
     * whenever signal event is fired, transport passes this down by aborting its own abort controller.
     */
    protected abortController: AbortController;
    /**
     * and instance of logger from @trezor/connect/src/utils/debug could be passed to activate logs from transport
     */
    protected logger?: Logger;

    constructor({ messages, logger }: AbstractTransportParams) {
        super();
        this.descriptors = [];
        this.messages = protobuf.Root.fromJSON(messages || {});
        this.abortController = new AbortController();
        this.logger = logger;
    }

    /**
     * Tries to initiate transport. Transport might not be available e.g. bridge not running.
     */
    abstract init(params?: AbortableParam): AsyncResultWithTypedError<
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
    abstract enumerate(
        params?: AbortableParam,
    ): AsyncResultWithTypedError<
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
    abstract acquire(params: { input: AcquireInput } & AbortableParam): AsyncResultWithTypedError<
        Session,
        // webusb
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.DESCRIPTOR_NOT_FOUND
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
    abstract release(params: ReleaseInput & AbortableParam): AsyncResultWithTypedError<
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
    abstract releaseDevice(session: Session): AsyncResultWithTypedError<void, string>;

    /**
     * Encode data and write it to transport layer
     */
    abstract send(
        params: {
            path?: string;
            session: Session;
            name: string;
            data: Record<string, unknown>;
            protocol?: TransportProtocol;
        } & AbortableParam,
    ): AsyncResultWithTypedError<undefined, ReadWriteError>;

    /**
     * Only read from transport
     */
    abstract receive(
        params: {
            path?: string;
            session: Session;
            protocol?: TransportProtocol;
        } & AbortableParam,
    ): AsyncResultWithTypedError<MessageFromTrezor, ReadWriteError>;

    /**
     * Send and read after that
     */
    abstract call(
        params: {
            session: Session;
            name: string;
            data: Record<string, unknown>;
            protocol?: TransportProtocol;
        } & AbortableParam,
    ): AsyncResultWithTypedError<MessageFromTrezor, ReadWriteError>;

    /**
     * Stop transport = remove all listeners + try to release session + cancel all requests
     */
    stop() {
        this.removeAllListeners();
        this.stopped = true;
        this.listening = false;
        this.abortController.abort();
        this.abortController = new AbortController();
        this.descriptors = [];
        this.acquiredUnconfirmed = {};
        this.listenPromise = {};
        this.releaseUnconfirmed = {};
        this.releasePromise = undefined;
    }

    private getDiff(nextDescriptors: Descriptor[]): DeviceDescriptorDiff[] {
        const oldDescriptors = new Map(this.descriptors.map(d => [getKey(d), d]));
        const newDescriptors = new Map(nextDescriptors.map(d => [getKey(d), d]));

        const [remaining, connected] = arrayPartition(nextDescriptors, n =>
            oldDescriptors.has(getKey(n)),
        );

        const disconnected = this.descriptors.filter(d => !newDescriptors.has(getKey(d)));

        const changed = remaining.filter(d => oldDescriptors.get(getKey(d))?.session !== d.session);

        return [
            ...disconnected.map(descriptor => ({ type: 'disconnected', descriptor }) as const),
            ...connected.map(descriptor => ({ type: 'connected', descriptor }) as const),
            ...changed.map(descriptor => {
                if (typeof descriptor.session === 'string') {
                    const subtype =
                        descriptor.session === this.acquiredUnconfirmed[descriptor.path]
                            ? 'here'
                            : 'elsewhere';

                    return { type: 'acquired', subtype, descriptor } as const;
                } else {
                    const subtype =
                        this.descriptors.find(prevD => prevD.path === descriptor.path)?.session ===
                        this.releaseUnconfirmed[descriptor.path]
                            ? 'here'
                            : 'elsewhere';

                    return { type: 'released', subtype, descriptor } as const;
                }
            }),
        ];
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
        this.logger?.debug('nextDescriptors', nextDescriptors, 'diff', diff);

        // even when there is no change from our point of view (see diff.didUpdate) it makes sense to update local descriptors because the
        // last descriptors we handled might in fact be different to what we have saved locally from the previous update. the reason is that
        // legacy bridge backends might be working with a different set of fields (eg. debug, debugSession). and we need to save this since
        // we need to pass this data to the next /listen call
        this.descriptors = nextDescriptors;

        if (!diff.length) {
            return;
        }

        Object.keys(this.listenPromise).forEach(path => {
            const descriptor = nextDescriptors.find(device => device.path === path);

            if (!descriptor) {
                return this.listenPromise[path].resolve(
                    this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION }),
                );
            }

            const listenedPathChanged = diff.find(
                d => d.descriptor.path === path && ['acquired', 'released'].includes(d.type),
            )?.descriptor;

            if (!listenedPathChanged) {
                return;
            }

            if (this.acquiredUnconfirmed[path]) {
                if (listenedPathChanged.session === this.acquiredUnconfirmed[path]) {
                    this.listenPromise[path].resolve(this.success(this.acquiredUnconfirmed[path]));
                } else {
                    // another app took over
                    this.listenPromise[path].resolve(
                        this.error({ error: ERRORS.SESSION_WRONG_PREVIOUS }),
                    );
                }
                delete this.acquiredUnconfirmed[path];
            }

            if (this.releaseUnconfirmed[path]) {
                if (!listenedPathChanged.session) {
                    // todo: solve me! this value is not used anyway. should be typed better
                    // @ts-expect-error
                    this.listenPromise[path].resolve(this.success(null));
                    delete this.releaseUnconfirmed[path];
                }
                // when releasing we don't really care about else
            }
        });

        diff.forEach(diffItem => {
            this.emit(TRANSPORT.UPDATE, diffItem);
        });
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

    protected unknownError = <E extends AnyError = never>(
        err: Error | string,
        expectedErrors: E[] = [],
    ) => {
        this.logger?.error(this.name, 'unexpected error: ', err);

        return unknownError(typeof err !== 'string' ? err : new Error(err), expectedErrors);
    };

    private mergeAbort(signal?: AbortSignal) {
        if (!signal) {
            return { signal: this.abortController.signal, clear: () => {} };
        }
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        signal.addEventListener('abort', onAbort);
        this.abortController.signal.addEventListener('abort', onAbort);
        const clear = () => {
            signal.removeEventListener('abort', onAbort);
            this.abortController.signal.removeEventListener('abort', onAbort);
        };

        return { signal: controller.signal, clear };
    }

    protected scheduleAction = <T, E extends AnyError = never>(
        action: ScheduledAction<T>,
        params?: ScheduleActionParams,
        errors: E[] = [],
    ) => {
        const { signal, clear } = this.mergeAbort(params?.signal);

        return scheduleAction(action, {
            timeout: ACTION_TIMEOUT,
            ...params,
            signal,
        })
            .catch(err =>
                unknownError(err, [ERRORS.ABORTED_BY_TIMEOUT, ERRORS.ABORTED_BY_SIGNAL, ...errors]),
            )
            .finally(clear);
    };
}

export type AbstractTransportMethodParams<K extends keyof AbstractTransport> =
    AbstractTransport[K] extends (...args: any[]) => any
        ? Parameters<AbstractTransport[K]>[0]
        : never;
