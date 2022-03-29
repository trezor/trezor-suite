// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/deferred.js

// TODO: https://github.com/trezor/trezor-suite/issues/4786
export type Deferred<T, I = any, D = any> = {
    id?: I;
    data?: D;
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
};

export type AsyncDeferred<T> = {
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
    run: (...args: any[]) => any;
};

export function create<T, I = any, D = any>(arg?: I, data?: D): Deferred<T, I, D> {
    let localResolve: (t: T) => void = (_t: T) => {};
    let localReject: (e?: Error) => void = (_e?: Error) => {};
    let id: I | undefined;

    // eslint-disable-next-line no-async-promise-executor
    const promise: Promise<T> = new Promise(async (resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
        if (typeof arg === 'function') {
            try {
                await arg();
            } catch (error) {
                reject(error);
            }
        }
        if (typeof arg === 'string') id = arg;
    });

    return {
        id,
        data,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
}

export function createAsync<T>(innerFn: (...args: any[]) => any): AsyncDeferred<T> {
    let localResolve: (t: T) => void = (_t: T) => {};
    let localReject: (e?: Error) => void = _e => {};

    const promise: Promise<T> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    const inner = async (): Promise<void> => {
        await innerFn();
    };

    return {
        resolve: localResolve,
        reject: localReject,
        promise,
        run: () => {
            inner();
            return promise;
        },
    };
}

export function resolveTimeoutPromise<T>(delay: number, result: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(result);
        }, delay);
    });
}

export const rejectTimeoutPromise = (delay: number, error: Error) =>
    new Promise<any>((_resolve, reject) => {
        setTimeout(() => {
            reject(error);
        }, delay);
    });
