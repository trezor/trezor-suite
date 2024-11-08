import { createDeferred } from '@trezor/utils';

export const abortablePromise = <T = void>(signal: AbortSignal) => {
    const { promise, reject, resolve } = createDeferred<T>();
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort);
    if (signal.aborted) onAbort();

    return {
        promise: promise.finally(() => signal.removeEventListener('abort', onAbort)),
        resolve,
    };
};
