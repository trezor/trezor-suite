import SuiteDB, { StorageUpdateMessage } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { migrate } from './migrations';

export interface SuiteDBSchema extends DBSchema {
    txs: {
        key: string;
        value: WalletAccountTransaction;
        indexes: {
            txId: WalletAccountTransaction['txid'];
            accountId: string; // custom field
            blockTime: number; // blockTime can be undefined?
            type: WalletAccountTransaction['type'];
            'accountId-blockTime': [number, number];
        };
    };
    suiteSettings: {
        key: string;
        value: { language: SuiteState['language'] };
    };
    walletSettings: {
        key: string;
        value: WalletSettings;
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', 1, async (
    db,
    oldVersion,
    newVersion,
    transaction,
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    const shouldInitDB = oldVersion === 0;
    if (shouldInitDB) {
        // init db
        // object store for wallet transactions
        const txsStore = db.createObjectStore('txs', { keyPath: 'id', autoIncrement: true });
        txsStore.createIndex('txId', 'txid', { unique: true });
        txsStore.createIndex('type', 'type', { unique: false }); // sent/recv
        txsStore.createIndex('blockTime', 'blockTime', { unique: false });
        txsStore.createIndex('accountId', 'accountId', { unique: false });
        txsStore.createIndex('accountId-blockTime', ['accountId', 'blockTime'], {
            unique: false,
        });
        // object store for settings
        db.createObjectStore('suiteSettings');
        db.createObjectStore('walletSettings');
    } else {
        migrate(db, oldVersion, newVersion, transaction);
    }
});
