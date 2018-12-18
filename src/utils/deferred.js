/* @flow */

export type Deferred<T> = {
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void,
};

export function deferred<T>(): Deferred<T> {
    // ignoring coverage on functions that are just for
    // type correctness
    /* istanbul ignore next */
    let outResolve = (t: T) => {};
    /* istanbul ignore next */
    let outReject = (e: Error) => {};
    const promise = new Promise((resolve, reject) => {
        outResolve = resolve;
        outReject = reject;
    });
    return {
        promise,
        resolve: outResolve,
        reject: outReject,
    };
}
