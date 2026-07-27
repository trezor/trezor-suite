import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('25.7.0', db => {
    if (!db.objectStoreNames.contains('bioAuth')) {
        db.createObjectStore('bioAuth');
    }

    //  @ts-expect-error
    if (db.objectStoreNames.contains('discovery')) {
        //  @ts-expect-error
        db.deleteObjectStore('discovery');
    }
});
