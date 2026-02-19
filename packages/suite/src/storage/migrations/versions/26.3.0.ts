import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.3.0', db => {
    db.createObjectStore('suiteSyncOwners');
    db.createObjectStore('phishing');
});
