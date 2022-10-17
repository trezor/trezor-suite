import type { DBMigration } from './types';

const VERSION = 19;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

    // no longer uses keyPath to generate primary key
    if (db.objectStoreNames.contains('fiatRates')) {
        db.deleteObjectStore('fiatRates');
    }
    db.createObjectStore('fiatRates');
};

export default migrate;
