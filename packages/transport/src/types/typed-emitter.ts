import { EventEmitter } from 'events';

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export interface TypedEmitter<T extends EventMap> {
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): this;
    emit<K extends EventKey<T>>(eventName: K, params: T[K]): boolean;
}
export class TypedEmitter<T extends EventMap> extends EventEmitter {}
