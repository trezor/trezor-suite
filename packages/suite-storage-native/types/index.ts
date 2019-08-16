export const STORE_TXS = 'txs';
export const STORE_SUITE_SETTINGS = 'suiteSettings';
export const STORE_WALLET_SETTINGS = 'walletSettings';

export interface StorageUpdateMessage {
    // TODO: only key strings from MyDBV1 should be allowed
    store: string;
    keys: any[];
}

export interface StorageMessageEvent extends MessageEvent {
    data: StorageUpdateMessage;
}
