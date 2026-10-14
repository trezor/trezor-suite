import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.10.0.2', db => {
    if (!db.objectStoreNames.contains('stellarContractTokens')) {
        db.createObjectStore('stellarContractTokens');
    }
});
