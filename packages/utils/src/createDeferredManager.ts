import { createDeferred, Deferred } from './createDeferred';

type ManagedDeferred<T> = Deferred<T, number> & { deadline: number };

type DeferredManagerOptions = {
    /** default timeout for promises without explicitly specified timeout */
    timeout?: number;
    /** callback which is called whenever a promise time out, with its id */
    onTimeout?: (promiseId: number) => void;
    /** from which id should the promises start (for specific use case, should be removed in the future) */
    initialId?: number;
};

type DeferredManager<T> = {
    /** How many pending promises are there */
    length: () => number;
    /** ID of the next created promise (for specific use case, should be removed in the future) */
    nextId: () => number;
    /** Creates new pending promise (with optional timeout) and returns it and its unique id */
    create: (timeout?: number) => { promiseId: number; promise: Promise<T> };
    /** Resolves (and removes) promise with given id by given value and returns whether it was present or not */
    resolve: (promiseId: number, value: T) => boolean;
    /** Rejects (and removes) promise with given id by given error and returns whether it was present or not */
    reject: (promiseId: number, error: Error) => boolean;
    /** Rejects (and removes) all pending promises by given error */
    rejectAll: (error: Error) => void;
};

/**
 * Handles the frequently repeated pattern of many deferred promises with unique ids
 * (usually requests), which can be resolved or rejected in a random order, or they can
 * time out
 *
 * @param options optional default timeout and onTimeout callback
 *
 * @returns Deferred promise manager instance
 */
export const createDeferredManager = <T = any>(
    options?: DeferredManagerOptions,
): DeferredManager<T> => {
    const { initialId = 0, timeout: defaultTimeout = 0, onTimeout } = options ?? {};
    const promises: ManagedDeferred<T>[] = [];

    let ID = initialId;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const length = () => promises.length;

    const nextId = () => ID;

    const replanTimeout = () => {
        const now = Date.now();
        const nearestDeadline = promises.reduce(
            (prev, { deadline }) => (prev && deadline ? Math.min : Math.max)(prev, deadline),
            0,
        );
        if (timeoutHandle) clearTimeout(timeoutHandle);
        timeoutHandle = nearestDeadline
            ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
              setTimeout(timeoutCallback, Math.max(nearestDeadline - now, 0)) // TODO min safe interval instead of zero?
            : undefined;
    };

    const timeoutCallback = () => {
        const now = Date.now();
        promises
            .filter(promise => promise.deadline && promise.deadline <= now)
            .forEach(promise => {
                onTimeout?.(promise.id);
                promise.deadline = 0;
            });
        replanTimeout();
    };

    const create = (timeout = defaultTimeout) => {
        const promiseId = ID++;
        const deferred = createDeferred<T, number>(promiseId);
        const deadline = timeout && Date.now() + timeout;
        promises.push({ ...deferred, deadline });
        if (timeout) replanTimeout();

        return { promiseId, promise: deferred.promise };
    };

    const extract = (promiseId: number) => {
        const index = promises.findIndex(({ id }) => id === promiseId);
        const [promise] = index >= 0 ? promises.splice(index, 1) : [undefined];
        if (promise?.deadline) replanTimeout();

        return promise;
    };

    const resolve = (promiseId: number, value: T) => {
        const promise = extract(promiseId);
        promise?.resolve(value);

        return !!promise;
    };

    const reject = (promiseId: number, error: Error) => {
        const promise = extract(promiseId);
        promise?.reject(error);

        return !!promise;
    };

    const rejectAll = (error: Error) => {
        promises.forEach(promise => promise.reject(error));
        const deleted = promises.splice(0, promises.length);
        if (deleted.length) replanTimeout();
    };

    return { length, nextId, create, resolve, reject, rejectAll };
};
