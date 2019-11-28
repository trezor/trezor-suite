export function create<T>(id: number | string): Deferred<T> {
    // intentionally ignore below lines in test coverage, they will be overridden in promise creation
    /* istanbul ignore next */
    let localResolve: (t: T) => void = () => {};
    /* istanbul ignore next */
    let localReject: (e?: Error) => void = () => {};

    const promise: Promise<T> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    return {
        id,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
}

export interface Deferred<T> {
    id: number | string;
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
}
