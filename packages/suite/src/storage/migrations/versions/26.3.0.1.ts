import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.3.0.1', db => {
    db.createObjectStore('experimentalFeedback');
});
