/* @flow */
'use strict';
import type { Deferred } from '../types';

export function create<T>(arg?: (() => Promise<void>) | number): Deferred<T> {
    let localResolve: (t: T) => void = (t: T) => {};
    let localReject: (e?: ?Error) => void = (e: ?Error) => {};
    let id: number = arg;

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
        id: id,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
}