import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// Cache of the release notes manifest fetched from data.trezor.io
export default createMigration<SuiteDBSchema>('26.8.0.3', db => {
    db.createObjectStore('releaseNotes');
});
