import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.6.0', db => {
    db.createObjectStore('graphFiatRates');
});
