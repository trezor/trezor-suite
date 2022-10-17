import type { DBMigration } from './types';

const VERSION = 14;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

    // added graph object store
    const graphStore = db.createObjectStore('graph', {
        keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
    });
    graphStore.createIndex('accountKey', [
        'account.descriptor',
        'account.symbol',
        'account.deviceState',
    ]);
    graphStore.createIndex('deviceState', 'account.deviceState');
};

export default migrate;
