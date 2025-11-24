import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('25.12.0.1', (db, tx) => {
    if (db.objectStoreNames.contains('suiteSyncSettings')) {
        db.deleteObjectStore('suiteSyncSettings');
        db.createObjectStore('suiteSyncSettings');
        tx.objectStore('suiteSyncSettings').put(
            {
                isFeatureSuiteSyncAvailable: false,
                isSuiteSyncEnabled: false,
                isSuiteSyncDebugEnabled: false,
                suiteSyncRelayUrl: null,
            },
            'suiteSyncSettings',
        );
    }
});
