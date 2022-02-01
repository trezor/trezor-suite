// todo: move to @trezor/utils. probably "resolveAfter"?

export type Deferred<T> = {
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
    rejectingPromise: Promise<any>;
};

export function create<T>(): Deferred<T> {
    let localResolve: (t: T) => void = () => {};
    let localReject: (e?: Error) => void = () => {};

    const promise = new Promise<T>((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });
    const rejectingPromise = promise.then(() => {
        throw new Error(`Promise is always rejecting`);
    });
    rejectingPromise.catch(() => {});

    return {
        resolve: localResolve,
        reject: localReject,
        promise,
        rejectingPromise,
    };
}

export function resolveTimeoutPromise<T>(delay: number, result: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(result);
        }, delay);
    });
}
