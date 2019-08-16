import {
    saveSuiteSettings,
    saveWalletSettings,
    getSuiteSettings,
    getWalletSettings,
} from './stores/settings/index';
import {
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
} from './stores/transactions/index';

let db: string;
// we reuse the same instance of broadcast channel for both sending the message
// and setting a listener, so the sender tab (source) won't receive its own messages

export const isIndexedDBAvailable = (cb: (isAvailable: boolean) => void) => {
    return null;
};

export const notify = () => {
    return null;
};

export const onChange = (handler: (event) => any) => {
    return null;
};

// TODO: for typing migration/upgrade functions look at https://github.com/jakearchibald/idb#typescript
const onUpgrade = async () => {
    return null;
};

export const getDB = async () => {
    return null;
};

export { saveSuiteSettings, saveWalletSettings, getSuiteSettings, getWalletSettings };
export {
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
};
