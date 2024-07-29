import { TypedEmitter } from '@trezor/utils';
import type {
    AnyError,
    AsyncResultWithTypedError,
    Success,
    Logger,
    DescriptorApiLevel,
} from '../types';
import { success, error, unknownError } from '../utils/result';

import * as ERRORS from '../errors';

export interface AbstractApiConstructorParams {
    logger?: Logger;
}

// https://github.dev/trezor/trezord-go/blob/db03d99230f5b609a354e3586f1dfc0ad6da16f7/core/core.go#L46-L47
export enum DEVICE_TYPE {
    TypeT1Hid = 0,
    TypeT1Webusb = 1,
    TypeT1WebusbBoot = 2,
    TypeT2 = 3,
    TypeT2Boot = 4,
    TypeEmulator = 5,
}

/**
 * This class defines unifying shape for native communication interfaces such as
 * - navigator.bluetooth
 * - navigator.usb
 * This is not public API. Only a building block which is used in src/transports
 */
export abstract class AbstractApi extends TypedEmitter<{
    'transport-interface-change': DescriptorApiLevel[];
    'transport-interface-error': typeof ERRORS.DEVICE_NOT_FOUND | typeof ERRORS.DEVICE_UNREADABLE;
}> {
    protected logger?: Logger;
    protected listening: boolean = false;

    constructor({ logger }: AbstractApiConstructorParams) {
        super();

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
        path: string,
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
        path: string,
        buffers: Buffer,
        signal?: AbortSignal,
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.UNEXPECTED_ERROR
    >;

    /**
     * set device to the state when it is available to read/write
     */
    abstract openDevice(
        path: string,
        first: boolean,
        signal?: AbortSignal,
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
    >;

    /**
     * set device to the state when it is available to openDevice again
     */
    abstract closeDevice(
        path: string,
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

    protected success<T>(payload: T): Success<T> {
        return success(payload);
    }

    protected error<E extends AnyError>(payload: { error: E; message?: string }) {
        return error(payload);
    }

    protected unknownError<E extends AnyError>(err: Error, expectedErrors: E[]) {
        this.logger?.error('transport: abstract api: unknown error', err);

        return unknownError(err, expectedErrors);
    }
}

export type AbstractApiAwaitedResult<K extends keyof AbstractApi> = AbstractApi[K] extends (
    ...args: any[]
) => any
    ? Awaited<ReturnType<AbstractApi[K]>>
    : never;
