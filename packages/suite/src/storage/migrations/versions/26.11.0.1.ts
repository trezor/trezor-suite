import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.11.0.1', db => {
    if (!db.objectStoreNames.contains('runtimeNetworkPreferences')) {
        db.createObjectStore('runtimeNetworkPreferences');
    }
});
