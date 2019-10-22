import SuiteDB, { StorageUpdateMessage } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { AcquiredDevice } from '@suite-types';
import { Account, Discovery } from '@wallet-types';
import { migrate } from './migrations';

const VERSION = 3;

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
        value: SendFormState;
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
        key: string;
        value: AcquiredDevice;
    };
    accounts: {
        key: string[];
        value: Account;
        indexes: {
            deviceState: string;
        };
    };
    discovery: {
        key: string;
        value: Discovery;
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

        // object store for devices
        db.createObjectStore('devices');
        // object store for accounts
        const accountsStore = db.createObjectStore('accounts', {
            keyPath: ['descriptor', 'symbol', 'deviceState'],
        });
        accountsStore.createIndex('deviceState', 'deviceState', { unique: false });

        // object store for discovery
        db.createObjectStore('discovery', { keyPath: 'deviceState' });

        // object store for send form
        db.createObjectStore('sendForm');
    } else {
        // migrate functions
        migrate(db, oldVersion, newVersion, transaction);
    }
});
