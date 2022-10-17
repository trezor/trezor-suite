import type { DBMigration } from './types';
import { updateAll } from './utils';

const VERSION = 28;

const migrate: DBMigration = async ({ db, oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    await updateAll(transaction, 'devices', device => {
        if (device.state?.includes('undefined')) {
            device.state = device.state.replace('undefined', '0');
            return device;
        }
    });

    // accounts
    const accountsStoreOld = transaction.objectStore('accounts');
    const accounts = await accountsStoreOld.getAll();
    db.deleteObjectStore('accounts');

    const accountsStoreNew = db.createObjectStore('accounts', {
        keyPath: ['descriptor', 'symbol', 'deviceState'],
    });
    accountsStoreNew.createIndex('deviceState', 'deviceState', { unique: false });

    accounts.forEach(account => {
        account.deviceState = account.deviceState.replace('undefined', '0');
        account.key = account.key.replace('undefined', '0');
        accountsStoreNew.add(account);
    });

    // transactions
    const txsStoreOld = transaction.objectStore('txs');
    const txs = await txsStoreOld.getAll();
    db.deleteObjectStore('txs');

    const txsStoreNew = db.createObjectStore('txs', {
        keyPath: ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'],
    });
    txsStoreNew.createIndex('txid', 'tx.txid', { unique: false });
    txsStoreNew.createIndex('order', 'order', { unique: false });
    txsStoreNew.createIndex('blockTime', 'tx.blockTime', { unique: false });
    txsStoreNew.createIndex('deviceState', 'tx.deviceState', { unique: false });
    txsStoreNew.createIndex('accountKey', ['tx.descriptor', 'tx.symbol', 'tx.deviceState'], {
        unique: false,
    });

    txs.forEach(tx => {
        tx.tx.deviceState = tx.tx.deviceState.replace('undefined', '0');
        txsStoreNew.add(tx);
    });

    // graph
    const graphStoreOld = transaction.objectStore('graph');
    const graphs = await graphStoreOld.getAll();
    db.deleteObjectStore('graph');

    const graphStoreNew = db.createObjectStore('graph', {
        keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
    });
    graphStoreNew.createIndex('accountKey', [
        'account.descriptor',
        'account.symbol',
        'account.deviceState',
    ]);
    graphStoreNew.createIndex('deviceState', 'account.deviceState');

    graphs.forEach(graph => {
        graph.account.deviceState = graph.account.deviceState.replace('undefined', '0');
        graphStoreNew.add(graph);
    });

    // discovery
    const discoveryStoreOld = transaction.objectStore('discovery');
    const discoveries = await discoveryStoreOld.getAll();
    db.deleteObjectStore('discovery');

    const discoveryStoreNew = db.createObjectStore('discovery', { keyPath: 'deviceState' });

    discoveries.forEach(discovery => {
        discovery.deviceState = discovery.deviceState.replace('undefined', '0');
        discoveryStoreNew.add(discovery);
    });
};

export default migrate;
