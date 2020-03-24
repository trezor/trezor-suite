import SuiteDB, { StorageUpdateMessage, OnUpgradeFunc } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { AcquiredDevice } from '@suite-types';
import { Account, Discovery, CoinFiatRates, WalletAccountTransaction } from '@wallet-types';
import { migrate } from './migrations';

const VERSION = 12;

export interface DBWalletAccountTransaction {
    tx: WalletAccountTransaction;
    order: number;
}

export interface SuiteDBSchema extends DBSchema {
    txs: {
        key: string;
        value: DBWalletAccountTransaction;
        indexes: {
            accountKey: string[]; // descriptor, symbol, deviceState
            txid: WalletAccountTransaction['txid'];
            deviceState: string;
            order: number;
            blockTime: number; // TODO: blockTime can be undefined
        };
    };
    sendForm: {
        key: string;
        value: SendFormState;
        indexes: {
            deviceState: string;
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
    fiatRates: {
        key: string;
        value: CoinFiatRates;
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;

/**
 *  If the object stores don't already exist then creates them.
 *  Otherwise runs a migration function that transform the data to new scheme version if necessary
 */
const onUpgrade: OnUpgradeFunc<SuiteDBSchema> = async (db, oldVersion, newVersion, transaction) => {
    // instead of doing proper migration just delete all object stores and recreate them
    // TODO: uncomment before RELEASE,
    // const shouldInitDB = oldVersion === 0;
    // if (shouldInitDB) {
    if (oldVersion < VERSION) {
        try {
            await SuiteDB.removeStores<SuiteDBSchema>(db);
        } catch (err) {
            console.error('error during removing all stores', err);
        }

        // init db
        // object store for wallet transactions
        const txsStore = db.createObjectStore('txs', {
            keyPath: ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'],
        });
        txsStore.createIndex('txid', 'tx.txid', { unique: false });
        txsStore.createIndex('order', 'order', { unique: false });
        txsStore.createIndex('blockTime', 'tx.blockTime', { unique: false });
        txsStore.createIndex('deviceState', 'tx.deviceState', { unique: false });
        txsStore.createIndex('accountKey', ['tx.descriptor', 'tx.symbol', 'tx.deviceState'], {
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
        const sendFormStore = db.createObjectStore('sendForm');
        sendFormStore.createIndex('deviceState', 'deviceState', { unique: false });

        db.createObjectStore('fiatRates', { keyPath: 'symbol' });
    } else {
        // migrate functions
        migrate(db, oldVersion, newVersion, transaction);
    }
};

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', VERSION, onUpgrade);
