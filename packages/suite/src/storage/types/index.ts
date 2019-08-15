import { DBSchema } from 'idb';

import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState as SuiteSettings } from '@suite-reducers/suiteReducer';
import { AccountTransaction } from 'trezor-connect';

export const STORE_TXS = 'txs';
export const STORE_SUITE_SETTINGS = 'suiteSettings';
export const STORE_WALLET_SETTINGS = 'walletSettings';

export interface WalletAccountTransaction extends AccountTransaction {
    accountId: number;
}

export interface MyDBV1 extends DBSchema {
    txs: {
        key: string;
        value: WalletAccountTransaction;
        indexes: {
            txId: AccountTransaction['txid'];
            accountId: string; // custom field
            blockTime: number; // blockTime can be undefined?
            type: AccountTransaction['type'];
            'accountId-blockTime': [number, number];
        };
    };
    suiteSettings: {
        key: string;
        value: { language: SuiteSettings['language'] };
    };
    walletSettings: {
        key: string;
        value: WalletSettings | { language: SuiteSettings['language'] };
    };
}

export interface StorageUpdateMessage {
    // TODO: only key strings from MyDBV1 should be allowed
    store: keyof MyDBV1;
    keys: any[];
}

export interface StorageMessageEvent extends MessageEvent {
    data: StorageUpdateMessage;
}
