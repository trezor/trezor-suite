import { createDeferred } from './createDeferred';

export const resolveAfter = <T = void>(msec: number, signal?: AbortSignal, value?: T) => {
    const { promise, reject, resolve } = createDeferred<T>();
    const timeout = setTimeout(resolve, msec, value);

    const onAbort = () => reject(signal?.reason);
    signal?.addEventListener('abort', onAbort);
    if (signal?.aborted) onAbort();

    return promise.finally(() => {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
    });
};
