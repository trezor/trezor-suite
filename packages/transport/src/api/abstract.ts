import { TypedEmitter, getSynchronize } from '@trezor/utils';

import { type TRANSPORT } from '../constants';
import * as ERRORS from '../errors';
import type {
    AnyError,
    ApiType,
    AsyncResultWithTypedError,
    DescriptorApiLevel,
    Logger,
    PathInternal,
} from '../types';
import { error, success, unknownError } from '../utils/result';

export interface AbstractApiConstructorParams {
    logger?: Logger;
    type: ApiType;
}

export type OpenDeviceChannel = 'read' | 'trezor-push-notification' | 'battery-level';

type AccessLock = {
    read: boolean;
    write: boolean;
};
/**
 * This class defines unifying shape for native communication interfaces such as
 * - navigator.bluetooth
 * - navigator.usb
 * This is not public API. Only a building block which is used in src/transports
 */

export abstract class AbstractApi extends TypedEmitter<{
    'transport-interface-change': DescriptorApiLevel[];
    'transport-interface-error': { error: typeof ERRORS.API_DISCONNECTED };
    [TRANSPORT.TREZOR_PUSH_NOTIFICATION]: { id: string; data: number[] };
    [TRANSPORT.BATTERY_LEVEL]: { id: string; data: number[] };
}> {
    protected logger?: Logger;
    protected listening: boolean = false;
    protected lock: Record<string, AccessLock> = {};
    public type: ApiType;
    constructor({ logger, type }: AbstractApiConstructorParams) {
        super();

        this.type = type;
        this.logger = logger;
    }
    /**
     * enumerate connected devices
     */
    abstract enumerate(
        signal?: AbortSignal,
    ): AsyncResultWithTypedError<
        DescriptorApiLevel[],
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.UNEXPECTED_ERROR
    >;

    /**
     * start emitting `transport-interface-change` events
     */
    abstract listen(): void;

    /**
     * read from device on path
     */
    abstract read(
        path: PathInternal,
        signal?: AbortSignal,
    ): AsyncResultWithTypedError<
        Buffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
    >;

    /**
     * write to device on path
     */
    abstract write(
        path: PathInternal,
        buffers: Buffer,
        signal?: AbortSignal,
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.UNEXPECTED_ERROR
    >;

    /**
     * set device to the state when it is available to read/write
     */
    abstract openDevice(
        path: PathInternal,
        options?: {
            reset: boolean;
            signal?: AbortSignal;
            channel?: OpenDeviceChannel;
        },
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.LIBUSB_ERROR_ACCESS
    >;

    /**
     * set device to the state when it is available to openDevice again
     */
    abstract closeDevice(
        path: PathInternal,
        options?: {
            channel?: OpenDeviceChannel;
        },
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE
        | typeof ERRORS.UNEXPECTED_ERROR
    >;

    abstract dispose(): void;

    /**
     * packet size for api
     */
    public abstract chunkSize: number;

    /**
     * send whole data in one chunk and let the native code handle the chunking (used only in React Native)
     */
    public nativeWriteChunking: boolean = false;

    protected unknownError<E extends AnyError = never>(err: Error, expectedErrors: E[] = []) {
        this.logger?.error('transport: abstract api: unknown error', err);

        return unknownError(err, expectedErrors);
    }

    private synchronize = getSynchronize();

    /**
     * call this to ensure single access to transport api.
     */
    private requestAccess({ lock, path }: { lock: AccessLock; path: string }) {
        if (!this.lock[path]) {
            this.lock[path] = { read: false, write: false };
        }
        // check already existing lock
        if ((this.lock[path].read && lock.read) || (this.lock[path].write && lock.write)) {
            return error({ code: ERRORS.OTHER_CALL_IN_PROGRESS });
        }
        // add to the current lock
        this.lock[path] = {
            read: this.lock[path].read || lock.read,
            write: this.lock[path].write || lock.write,
        };

        return success(undefined);
    }

    /**
     * 1. merges lock with current lock
     * 2. runs provided function
     * 3. clears its own lock
     */
    public runInIsolation = async <T extends () => ReturnType<T>>(
        { lock, path }: { lock: AccessLock; path: string },
        fn: T,
    ) => {
        const accessRes = this.requestAccess({ lock, path });
        if (!accessRes.success) {
            return accessRes;
        }

        try {
            // note: await is needed here
            return await this.synchronize(fn);
        } catch (err) {
            // this should never happen, incorrectly handled error on api level. fn should not throw.
            this.logger?.error('transport: abstract api: runInIsolation error', err);

            return this.unknownError(err);
        } finally {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const currentLock: AccessLock = this.lock[path];
            this.lock[path] = {
                read: lock.read ? false : currentLock.read,
                write: lock.write ? false : currentLock.write,
            };
        }
    };
}

export type AbstractApiAwaitedResult<K extends keyof AbstractApi> = AbstractApi[K] extends (
    ...args: any[]
) => any
    ? Awaited<ReturnType<AbstractApi[K]>>
    : never;
