import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// `tokenManagement` is created by the legacy version 46 migration. An upgrade that failed before the
// abort fix committed the new version anyway, so databases exist whose version claims the store is
// there while it never got created — and every later start then fails reading it, which surfaces as
// the corrupted-database screen. Recreating it empty is enough; the store only holds user choices.
export default createMigration<SuiteDBSchema>('26.10.0.2', db => {
    if (!db.objectStoreNames.contains('tokenManagement')) {
        db.createObjectStore('tokenManagement');
    }
});
