/*

use:
import { TypedEmitter } from '@trezor/node-utils/lib/typedEventEmitter';

example:
type EventMap = {
    obj: { id: string };
    primitive: boolean | number | string | symbol;
    noArgs: undefined;
    multipleArgs: (a: number, b: string, c: boolean) => void;
    [type: `dynamic/${string}`]: boolean;
};

*/

import { EventEmitter } from 'events';

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;

type IsUnion<T, U extends T = T> = T extends unknown ? ([U] extends [T] ? 0 : 1) : 2;

// NOTE: case 1. looks like case 4. but works differently. the order matters
type EventReceiver<T> = IsUnion<T> extends 1
    ? (event: T) => void // 1. use union payload
    : T extends (...args: any[]) => any
    ? T // 2. use custom callback
    : T extends undefined
    ? () => void // 3. enforce empty params
    : (event: T) => void; // 4. default

export interface TypedEmitter<T extends EventMap> {
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    once<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    addListener<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;

    prependListener<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    prependOnceListener<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;

    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    removeListener<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    removeAllListeners<K extends EventKey<T>>(event?: K): this;

    emit<K extends EventKey<T>>(eventName: K, ...params: Parameters<EventReceiver<T[K]>>): boolean;

    listeners<K extends EventKey<T>>(eventName: K): EventReceiver<T[K]>[];
    rawListeners<K extends EventKey<T>>(eventName: K): EventReceiver<T[K]>[];
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class TypedEmitter<T extends EventMap> extends EventEmitter {
    // implement at least one function
    listenerCount<K extends EventKey<T>>(eventName: K) {
        return super.listenerCount(eventName);
    }
}
