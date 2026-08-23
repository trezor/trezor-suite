import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.9.0', db => {
    if (!db.objectStoreNames.contains('graphFiatRates')) {
        db.createObjectStore('graphFiatRates');
    }
});
