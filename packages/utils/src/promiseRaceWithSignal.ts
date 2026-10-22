/**
 * Rejects with `signal.reason` as soon as the signal aborts. The `promise` itself is not cancelled.
 */
export const promiseRaceWithSignal = <T>(promise: Promise<T>, signal?: AbortSignal) => {
    if (!signal) return promise;

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => reject(signal.reason);
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();

        promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
};
