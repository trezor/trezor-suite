/* @flow */

export type Deferred<T> = {
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void
};

export function deferred<T>(): Deferred<T> {
    let resolve = (t:T) => {};
    let reject = (e: Error) => {};
    const promise = new Promise((inResolve, inReject) => {
        resolve = inResolve;
        reject = inReject;
    });
    return {
        promise,
        resolve,
        reject
    };
}
