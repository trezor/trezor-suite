import type { DBMigration } from './types';

const VERSION = 16;

const migrate: DBMigration = ({ db, oldVersion }) => {
    if (oldVersion >= VERSION) return;

    // @ts-expect-error sendForm doesn't exists anymore
    if (db.objectStoreNames.contains('sendForm')) {
        // @ts-expect-error sendForm doesn't exists anymore
        db.deleteObjectStore('sendForm');
    }
    // object store for send form
    db.createObjectStore('sendFormDrafts');
};

export default migrate;
