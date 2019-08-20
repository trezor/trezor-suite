import { StorageUpdateMessage as StorageUpdateMessage$, StorageMessageEvent } from './types';
import { isDBAvailable } from './utils';
import {
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
} from './stores/transactions/index';

import {
    saveSuiteSettings,
    saveWalletSettings,
    getSuiteSettings,
    getWalletSettings,
} from './stores/settings/index';

// const VERSION = 1;
let db: any;
// we reuse the same instance of broadcast channel for both sending the message
// and setting a listener, so the sender tab (source) won't receive its own messages
export type StorageUpdateMessage = StorageUpdateMessage$;

export const notify = (
    store: StorageUpdateMessage['store'],
    keys: StorageUpdateMessage['keys']
) => {
    // sends the message containing store, keys which were updated to other tabs/windows
    // @ts-ignore
    const message: StorageUpdateMessage = { store, keys };
    // broadcastChannel.postMessage(message);
};

export const onChange = (_handler: (event: StorageMessageEvent) => any) => {
    // listens to the channel. On receiving a message triggers the handler func
};

export const getDB = async () => {
    console.log('getting native db');
    if (!db) {
        db = null;
    }
    return db;
};

export {
    saveSuiteSettings,
    saveWalletSettings,
    getSuiteSettings,
    getWalletSettings,
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
    isDBAvailable,
};
