import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.10.0.3', db => {
    if (!db.objectStoreNames.contains('stellarDiscoveredContractTokens')) {
        db.createObjectStore('stellarDiscoveredContractTokens');
    }
});
