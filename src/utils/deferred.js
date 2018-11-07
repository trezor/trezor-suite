/* @flow */
import type { Deferred } from '../types';

export function create<T>(id: number): Deferred<T> {
    let localResolve: (t: T) => void = () => {};
    let localReject: (e?: ?Error) => void = () => {};

    const promise: Promise<T> = new Promise(async (resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    return {
        id: id,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
}
