import { StoreNames } from 'idb';

export interface StorageUpdateMessage<TDBSchema> {
    // TODO: only key strings from given store should be allowed
    store: StoreNames<TDBSchema>;
    keys: any[];
}

export interface StorageMessageEvent<T> extends MessageEvent {
    data: StorageUpdateMessage<T>;
}
