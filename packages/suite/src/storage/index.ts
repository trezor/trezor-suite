import SuiteDB, { StorageUpdateMessage, OnUpgradeFunc } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { State as AnalyticsState } from '@suite-reducers/analyticsReducer';
import { AcquiredDevice } from '@suite-types';
import { MetadataState } from '@suite-types/metadata';
import { Account, Discovery, CoinFiatRates, WalletAccountTransaction } from '@wallet-types';
import { GraphData } from '@wallet-types/graph';
import { migrate } from './migrations';

const VERSION = 15;
/**
 * Changelog
 *
 * 15
 * - added metadata object store
 * - added device.metadata
 * - added account.metadata
 */

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
        value: {
            settings: SuiteState['settings'];
            flags: SuiteState['flags'];
        };
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
    analytics: {
        key: string;
        value: AnalyticsState;
    };
    graph: {
        key: string[]; // descriptor, symbol, deviceState, interval
        value: GraphData;
        indexes: {
            accountKey: string[]; // descriptor, symbol, deviceState
            deviceState: string;
        };
    };
    metadata: {
        key: 'state';
        value: MetadataState;
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;

/**
 *  If the object stores don't already exist then creates them.
 *  Otherwise runs a migration function that transform the data to new scheme version if necessary
 */
const onUpgrade: OnUpgradeFunc<SuiteDBSchema> = async (db, oldVersion, newVersion, transaction) => {
    let shouldInitDB = oldVersion === 0;
    if (oldVersion > 0 && oldVersion < 13) {
        // just delete whole db as migrations from version older than 13 (internal releases) are not implemented
        try {
            await SuiteDB.removeStores(db);
            shouldInitDB = true;
        } catch (err) {
            console.error('Storage: Error during removing all stores', err);
        }
    }

    if (shouldInitDB) {
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
        db.createObjectStore('analytics');

        // graph
        const graphStore = db.createObjectStore('graph', {
            keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
        });
        graphStore.createIndex('accountKey', [
            'account.descriptor',
            'account.symbol',
            'account.deviceState',
        ]);
        graphStore.createIndex('deviceState', 'account.deviceState');

        // metadata
        db.createObjectStore('metadata');
    } else {
        // migrate functions
        console.warn('MIGRATE!', oldVersion, newVersion);
        migrate(db, oldVersion, newVersion, transaction);
    }
};

const onDowngrade = () => {
    // @ts-ignore
    const { ipcRenderer } = global;
    if (ipcRenderer) {
        // relaunch desktop app
        ipcRenderer.send('restart-app');
    } else {
        // @ts-ignore TODO: suite-native:  Cannot find name 'window'
        window.location.reload();
    }
};

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', VERSION, onUpgrade, onDowngrade);
