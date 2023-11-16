import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';
import type { AnyError, AsyncResultWithTypedError, Success, Logger } from '../types';
import { success, error, unknownError } from '../utils/result';

import * as ERRORS from '../errors';

export interface AbstractApiConstructorParams {
    logger?: Logger;
}

/**
 * This class defines unifying shape for native communication interfaces such as
 * - navigator.bluetooth
 * - navigator.usb
 * This is not public API. Only a building block which is used in src/transports
 */
export abstract class AbstractApi extends TypedEmitter<{
    'transport-interface-change': string[];
    'transport-interface-error': typeof ERRORS.DEVICE_NOT_FOUND | typeof ERRORS.DEVICE_UNREADABLE;
}> {
    logger: Logger;

    constructor({ logger }: AbstractApiConstructorParams) {
        super();

        // some abstract inactive logger
        this.logger = logger || {
            debug: (..._args: string[]) => {},
            log: (..._args: string[]) => {},
            warn: (..._args: string[]) => {},
            error: (..._args: string[]) => {},
        };
    }
    /**
     * enumerate connected devices
     */
    abstract enumerate(): AsyncResultWithTypedError<
        string[],
        | typeof ERRORS.ABORTED_BY_TIMEOUT
        | typeof ERRORS.ABORTED_BY_SIGNAL
        | typeof ERRORS.UNEXPECTED_ERROR
    >;

    /**
     * read from device on path
     */
    abstract read(
        path: string,
    ): AsyncResultWithTypedError<
        ArrayBuffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
    >;

    /**
     * write to device on path
     */
    abstract write(
        path: string,
        buffers: Buffer,
    ): AsyncResultWithTypedError<
        undefined,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
    >;

    /**
     * set device to the state when it is available to read/write
     */
    abstract openDevice(
        path: string,
        first: boolean,
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

    protected success<T>(payload: T): Success<T> {
        return success(payload);
    }

    protected error<E extends AnyError>(payload: { error: E; message?: string }) {
        return error(payload);
    }

    protected unknownError<E extends AnyError>(err: Error, expectedErrors: E[]) {
        return unknownError(err, expectedErrors);
    }
}
