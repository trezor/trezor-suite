export const createDeferred = <T, P = string | number | undefined>(id?: P) => {
    let localResolve: (t: T) => void = () => {};
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
};

export interface Deferred<T, P = string | number | undefined> {
    id: P;
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
}

// unwrap promise response from Deferred
export type DeferredResponse<D> = D extends Deferred<infer R> ? R : never;
