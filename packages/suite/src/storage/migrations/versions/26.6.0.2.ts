import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.6.0.2', db => {
    if (!db.objectStoreNames.contains('receive')) {
        db.createObjectStore('receive');
    }
});
