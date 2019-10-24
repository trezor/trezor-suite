import SuiteDB, { StorageUpdateMessage, OnUpgradeProps } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { AcquiredDevice } from '@suite-types';
import { Account, Discovery } from '@wallet-types';
import { migrate } from './migrations';

const VERSION = 4;

export interface SuiteDBSchema extends DBSchema {
    txs: {
        key: string;
        value: WalletAccountTransaction;
        indexes: {
            txid: WalletAccountTransaction['txid'];
            deviceState: string;
            blockTime: number; // TODO: blockTime can be undefined
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

/**
 *  If the object stores don't already exist then creates them.
 *  Otherwise runs a migration function that transform the data to new scheme version if necessary
 *
 * @param {OnUpgradeProps<SuiteDBSchema>['db']} db
 * @param {OnUpgradeProps<SuiteDBSchema>['oldVersion']} oldVersion
 * @param {OnUpgradeProps<SuiteDBSchema>['newVersion']} newVersion
 * @param {OnUpgradeProps<SuiteDBSchema>['transaction']} transaction
 */
const onUpgrade = async (
    db: OnUpgradeProps<SuiteDBSchema>['db'],
    oldVersion: OnUpgradeProps<SuiteDBSchema>['oldVersion'],
    newVersion: OnUpgradeProps<SuiteDBSchema>['newVersion'],
    transaction: OnUpgradeProps<SuiteDBSchema>['transaction'],
) => {
    const shouldInitDB = oldVersion === 0;
    // if (shouldInitDB) {
    // TODO: remove before RELEASE, instead of doing proper migration just delete all object stores and recreate them
    if (oldVersion < VERSION) {
        try {
            db.deleteObjectStore('accounts');
            db.deleteObjectStore('devices');
            db.deleteObjectStore('discovery');
            db.deleteObjectStore('sendForm');
            db.deleteObjectStore('suiteSettings');
            db.deleteObjectStore('txs');
            db.deleteObjectStore('walletSettings');
        } catch (err) {
            // do nothing;
        }

        // init db
        // object store for wallet transactions
        const txsStore = db.createObjectStore('txs', {
            keyPath: ['deviceState', 'descriptor', 'txid', 'type'],
        });
        txsStore.createIndex('txid', 'txid', { unique: false });
        txsStore.createIndex('blockTime', 'blockTime', { unique: false });
        txsStore.createIndex('deviceState', 'deviceState', { unique: false });

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
};

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', VERSION, onUpgrade);
