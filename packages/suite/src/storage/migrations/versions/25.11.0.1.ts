import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('25.11.0.1', (db, tx) => {
    // @ts-expect-error
    if (!db.objectStoreNames.contains('labelingSettings')) {
        // @ts-expect-error
        db.createObjectStore('labelingSettings');

        // @ts-expect-error
        tx.objectStore('labelingSettings').put(
            {
                isFeatureLocalFirstStorageAvailable: false,
                isLocalFirstStorageEnabled: false,
                isLocalFirstStorageDebugEnabled: false,
                localFirstStorageRelayUrl: null,
            },
            'labelingSettings',
        );
    }
});
