import SuiteDB, { OnUpgradeFunc } from '@trezor/suite-storage';
import { SuiteDBSchema } from './definitions';
import { migrate } from './migrations';

const VERSION = 21; // don't forget to add migration and CHANGELOG when changing versions!

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
        db.createObjectStore('sendFormDrafts');

        db.createObjectStore('fiatRates');
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

        db.createObjectStore('coinmarketTrades', { keyPath: 'key' });

        // metadata
        db.createObjectStore('metadata');
    } else {
        // migrate functions
        await migrate(db, oldVersion, newVersion, transaction);
    }
};

// ts-ignore below is for `suite-native:  Cannot find name 'window'`. TODO
const onDowngrade = () => {
    // @ts-ignore
    if (window.desktopApi) {
        // relaunch desktop app
        // @ts-ignore
        window.desktopApi.send('app/restart');
    } else {
        // @ts-ignore
        window.location.reload();
    }
};

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', VERSION, onUpgrade, onDowngrade);
