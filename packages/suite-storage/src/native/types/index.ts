export interface StorageUpdateMessage {
    store: any;
    keys: any[];
}

export interface StorageMessageEvent {
    data: StorageUpdateMessage;
}
