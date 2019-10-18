import SuiteDB, { StorageUpdateMessage } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { AcquiredDevice } from '@suite-types';
import { migrate } from './migrations';

const VERSION = 2;

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
    sendForm: {
        key: string;
        value: { id: string; state: SendFormState };
    };
    suiteSettings: {
        key: string;
        value: { language: SuiteState['language'] };
    };
    walletSettings: {
        key: string;
        value: WalletSettings;
    };
    devices: {
        key: number;
        value: AcquiredDevice;
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', VERSION, async (
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

        db.createObjectStore('devices', { keyPath: 'id', autoIncrement: true });

        // object store for send form
        db.createObjectStore('sendForm', { keyPath: 'id' });
    } else {
        migrate(db, oldVersion, newVersion, transaction);
    }
});
