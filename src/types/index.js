/* @flow */

export type Deferred<T> = {
    id: number,
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void,
};

export { Message } from './messages';
export { Response } from './responses';
