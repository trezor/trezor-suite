import * as protobuf from 'protobufjs/light';
import {
    scheduleAction,
    ScheduleActionParams,
    ScheduledAction,
    Deferred,
    getMutex,
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

export type AcquireReleaseChange =
    | { type: 'device-missing' }
    | { type: 'session-changed'; session: Session | null };

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

    protected readonly pathLock = getMutex();

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
        this.acquireUnconfirmed = {}; // TODO kill 'em all?
        this.releaseUnconfirmed = {}; // TODO and these as well?
        this.acquireReleaseEmitter.eventNames().forEach(path => {
            this.acquireReleaseEmitter.emit(path as string, { type: 'device-missing' });
        });
        this.listenPromise = {};
    }

    /**
     * when calling acquire, after it resolves successfully, we store the result (session)
     * and wait for next descriptors update (/listen in case of bridge or 'descriptors' message from sessions background)
     * and compare it with acquiringSession. Typically both values would equal but in certain edgecases
     * another application might have acquired session right after this application which means that
     * the originally received session is not longer valid and device is used by another application
     */
    protected acquireUnconfirmed: Record<string, Session> = {};
    protected releaseUnconfirmed: Record<string, Session> = {};
    protected readonly acquireReleaseEmitter = new TypedEmitter<{
        [path: string]: AcquireReleaseChange;
    }>();

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

        const oldDescriptors = new Map(this.descriptors.map(d => [getKey(d), d]));
        const newDescriptors = new Map(nextDescriptors.map(d => [getKey(d), d]));

        // present descriptors
        this.descriptors
            .filter(d => !newDescriptors.has(getKey(d)))
            .forEach(async descriptor => {
                const unlock = await this.pathLock(descriptor.path);
                // descriptor in present batch but not in incoming -> disconnected device
                if (
                    this.acquireUnconfirmed[descriptor.path] ||
                    this.releaseUnconfirmed[descriptor.path]
                ) {
                    this.acquireReleaseEmitter.emit(descriptor.path, {
                        type: 'device-missing',
                    });
                    delete this.acquireUnconfirmed[descriptor.path];
                    delete this.releaseUnconfirmed[descriptor.path];
                }
                unlock();
                this.emit(TRANSPORT.UPDATE, { type: 'disconnected', descriptor });
            });

        // incoming descriptors
        nextDescriptors.forEach(async descriptor => {
            const prevDescriptor = oldDescriptors.get(getKey(descriptor));

            if (!prevDescriptor) {
                // descriptor in incoming batch but not in present -> connected device
                this.emit(TRANSPORT.UPDATE, { type: 'connected', descriptor });
            } else if (prevDescriptor.session !== descriptor.session) {
                // present session different than incoming -> device acquired or released
                const { path, session } = descriptor;
                const unlock = await this.pathLock(path);

                this.acquireReleaseEmitter.emit(path, { type: 'session-changed', session });
                if (typeof session === 'string') {
                    // incoming session is defined -> device acquired somewhere
                    const subtype =
                        this.acquireUnconfirmed[path] === session ? 'here' : 'elsewhere';

                    this.emit(TRANSPORT.UPDATE, { type: 'acquired', subtype, descriptor });
                } else {
                    // incoming session is unset -> device released somewhere
                    // TODO descriptors from prev instead of current?
                    // TODO use product in key?
                    const subtype =
                        this.releaseUnconfirmed[path] === prevDescriptor.session
                            ? 'here'
                            : 'elsewhere';

                    this.emit(TRANSPORT.UPDATE, { type: 'released', subtype, descriptor });
                }
                // TODO is this correct?
                delete this.acquireUnconfirmed[path];
                delete this.releaseUnconfirmed[path];

                unlock();
            }
        });

        // TODO is it ok to save nextDescriptors AFTER all the events?

        // even when there is no change from our point of view (see diff.didUpdate) it makes sense to update local descriptors because the
        // last descriptors we handled might in fact be different to what we have saved locally from the previous update. the reason is that
        // legacy bridge backends might be working with a different set of fields (eg. debug, debugSession). and we need to save this since
        // we need to pass this data to the next /listen call
        this.descriptors = nextDescriptors;
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
