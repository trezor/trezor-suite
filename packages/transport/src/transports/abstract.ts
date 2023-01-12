import * as protobuf from 'protobufjs/light';

import { Deferred } from '@trezor/utils';
import * as defaultMessages from '../messages.json';
import { MessageFromTrezor, Session, Descriptor } from '../types';
import { TypedEmitter } from '../types/typed-emitter';
import * as ERRORS from '../errors';
import { getAbortController, Controller as AbortController } from '../utils/abortController';
import { AbortablePromise } from '../utils/abortablePromise';

export type AcquireInput = {
    path: string;
    // todo: shouldn't previous be required?
    previous?: Session;
};

type DeviceDescriptorDiff = {
    didUpdate: boolean;
    descriptors: Descriptor[];
    connected: Descriptor[];
    disconnected: Descriptor[];
    changedSessions: Descriptor[]; // deprecated
    acquired: Descriptor[]; // deprecated
    // newly added
    acquiredByMyself: Descriptor[];
    acquiredElsewhere: Descriptor[];
    released: Descriptor[]; // deprecated
    // newly added
    releasedByMyself: Descriptor[];
    releasedElsewhere: Descriptor[];
};

export const TRANSPORT = {
    START: 'transport-start',
    ERROR: 'transport-error',
    UPDATE: 'transport-update',
    DISABLE_WEBUSB: 'transport-disable_webusb',
    REQUEST_DEVICE: 'transport-request_device',
} as const;

type ConstructorParams = {
    messages?: Record<string, any>;
};

export abstract class Transport extends TypedEmitter<{
    [TRANSPORT.UPDATE]: DeviceDescriptorDiff;
    [TRANSPORT.ERROR]: string;
    // [TRANSPORT.START]: string;
}> {
    // todo: default
    messages: protobuf.Root;

    name: 'BridgeTransport' | 'NodeUsbTransport' | 'WebUsbTransport' | 'AbstractTransport';

    // transports with "external element" such as bridge can be outdated.
    isOutdated = false;
    // transports with "external element" such as bridge can have version.
    version = '';

    // once transport has been stopped, it does not emit any events or throws errors on async operations
    stopped = false;

    listening = false;

    // minimal data to track device on transport layer
    descriptors: Descriptor[];

    acquiringSession?: string; // session
    acquiringPath?: string;

    listenPromise?: Deferred<any>;
    acquirePromise?: Deferred<any>;

    releasePromise?: Deferred<any>;
    releasing?: string; // session

    abortController: AbortController;

    private logger: any;

    constructor({ messages }: ConstructorParams) {
        super();
        this.descriptors = [];
        this.messages = protobuf.Root.fromJSON(
            (messages as protobuf.INamespace) || defaultMessages,
        );
        this.name = 'AbstractTransport';
        this.abortController = getAbortController();

        this.logger = {
            debug: (...args: any) => {
                console.log(`[${this.name}]: `, ...args);
            },
            log: (...args: any) => {
                console.log(`[${this.name}]: `, ...args);
            },
        };
    }

    /**
     * Tries to initiate transport. Transport might not be available e.g. bridge not running.
     * TODO: return type? should it ever throw?
     */
    abstract init(): Promise<{ success: true } | { success: false; message?: string }>;

    /**
     * Setup listeners for device changes (connect, disconnect, change?).
     * What should it do? Will start emitting DEVICE events after this is fired?
     * - should call onDescriptorsUpdated in the end
     */
    abstract listen(): void;

    /**
     * List Trezor devices
     */
    abstract enumerate(emit?: boolean): Promise<Descriptor[]>;

    /**
     * Acquire session
     */
    abstract acquire({ input, first }: { input: AcquireInput; first?: boolean }): Promise<string>;

    /**
     * Release session
     */
    abstract release(session: string, onclose: boolean): Promise<void>;

    /**
     * Release device
     * This does nothing for transports using "external element" such as bridge
     * For transports with native access (webusb), this informs lower transport layer
     * that device is not going to be used anymore
     */
    // naming releaseInterface
    abstract releaseDevice(path: string): Promise<void>;

    /**
     * Encode data and write it to transport layer
     */
    abstract send({
        path,
        session,
        data,
        name,
    }: {
        path?: string;
        session?: string;
        // wrap object and name?
        name: string;
        data: Record<string, unknown>;
    }): Promise<void>;

    /**
     * Only read from transport
     */
    abstract receive({
        path,
        session,
    }: {
        path?: string;
        session?: string;
    }): Promise<MessageFromTrezor>;

    /**
     * send and read after that
     */
    abstract call({
        session,
        name,
        data,
    }: {
        session: string;
        name: string;
        data: Record<string, unknown>;
    }): Promise<MessageFromTrezor>;

    /**
     * Stop transport. Remove all listeners. Try to release all sessions. Cancel all requests
     */
    stop() {
        this.stopped = true;
        console.log('abstract: stop transport');
    }

    private _getDiff(nextDescriptors: Descriptor[]): DeviceDescriptorDiff {
        const connected = nextDescriptors.filter(
            nextDescriptor =>
                this.descriptors.find(descriptor => descriptor.path === nextDescriptor.path) ==
                undefined,
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
        const acquiredByMyself = acquired.filter(d => d.session === this.acquiringSession);
        const acquiredElsewhere = acquired.filter(d => d.session !== this.acquiringSession);

        const released = changedSessions.filter(d => typeof d.session !== 'string');
        const releasedByMyself = released.filter(
            d => this.descriptors.find(prevD => prevD.path === d.path)?.session === this.releasing,
        );
        const releasedElsewhere = released.filter(
            d => this.descriptors.find(prevD => prevD.path === d.path)?.session !== this.releasing,
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

        this.log('this.acquiringSession', this.acquiringSession);
        this.log('this.listenPromise', this.listenPromise);

        const diff = this._getDiff(nextDescriptors);

        this.log('handleDescriptorsChange:diff', diff);

        this.descriptors = nextDescriptors;

        if (diff.didUpdate) {
            // todo: maybe if (this.listenPromise && this.acquiringSession) ?
            // what comes first? response to listen or response to acquire?
            if (this.listenPromise) {
                const descriptor = nextDescriptors.find(
                    device => device.path === this.acquiringPath,
                );

                if (!descriptor) {
                    this.log('edgecase: device was disconnected');
                    throw new Error(ERRORS.DEVICE_DISCONNECTED);
                }

                const reportedNextSession = descriptor.session;

                if (reportedNextSession == this.acquiringSession) {
                    this.listenPromise.resolve(this.acquiringSession);
                } else {
                    // todo: proper error
                    // todo: catch in acquire? catch where acquire is called?
                    this.listenPromise.reject(new Error('used elsewhere'));
                }
            }

            // todo: releasePromise logic does not make much sense. there are two cases:
            // 1. simple release, without disconnecting device
            // 2. release after device was disconnected, I am not sure about this one, maybe bridge handles this?
            //    and maybe we don't need to release after device was disconnected? but if this is the case, we receive empty nextDescriptors
            if (this.releasePromise) {
                this.releasePromise.resolve(undefined);
            }
            this.emit(TRANSPORT.UPDATE, diff);
            this.releasing = undefined;
            this.acquiringSession = undefined;
        }
    }

    log(...args: any) {
        return this.logger.debug(...args);
    }

    setLogger(logger: any) {
        this.logger = logger;
    }

    // hmm does it make sense?
    abortablePromise(executor: ConstructorParameters<typeof AbortablePromise>[0]) {
        return new AbortablePromise(executor, this.abortController);
    }
}
