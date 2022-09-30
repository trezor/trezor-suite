import type { DBMigration } from './types';

const VERSION = 24;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

    db.createObjectStore('formDrafts');
};

export default migrate;
