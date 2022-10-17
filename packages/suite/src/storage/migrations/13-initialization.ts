import type { DBMigration } from './types';

const VERSION = 13;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

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

    db.createObjectStore('analytics');
};

export default migrate;
