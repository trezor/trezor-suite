import * as ERRORS from '../errors';

export type AnyError = (typeof ERRORS)[keyof typeof ERRORS];

export interface Success<T> {
    success: true;
    payload: T;
}

export type ErrorGeneric<ErrorType> = ErrorType extends AnyError
    ? {
          success: false;
          error: ErrorType;
      }
    : {
          success: false;
          error: ErrorType;
          message?: string;
      };

export type ResultWithTypedError<T, E> = Success<T> | ErrorGeneric<E>;
export type AsyncResultWithTypedError<T, E> = Promise<Success<T> | ErrorGeneric<E>>;

/**
 * Public interface of all transport methods
 * promise resolves in actual result of the call
 * abort is a reference to local AbortController.abort method
 */
export type AbortableCall<T, E> = {
    promise: AsyncResultWithTypedError<T, E>;
    abort: () => void;
};
