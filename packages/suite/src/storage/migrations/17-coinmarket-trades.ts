import type { DBMigration } from './types';

const VERSION = 17;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

    db.createObjectStore('coinmarketTrades', { keyPath: 'key' });
};

export default migrate;
