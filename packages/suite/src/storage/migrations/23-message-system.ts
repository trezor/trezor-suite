import type { DBMigration } from './types';

const VERSION = 23;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

    db.createObjectStore('messageSystem');
};

export default migrate;
