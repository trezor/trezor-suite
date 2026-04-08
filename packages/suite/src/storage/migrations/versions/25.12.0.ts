import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('25.12.0', (db, tx) => {
    // @ts-expect-error `labelingSettings` no longer exists, migrates to `suiteSyncSettings`
    if (db.objectStoreNames.contains('labelingSettings')) {
        // @ts-expect-error
        db.deleteObjectStore('labelingSettings');
    }

    if (!db.objectStoreNames.contains('suiteSyncSettings')) {
        db.createObjectStore('suiteSyncSettings');

        tx.objectStore('suiteSyncSettings').put(
            // Uses old schema shape; migration 26.5.0 converts `suiteSyncRelayUrl` → `suiteSyncServer`
            {
                isSuiteSyncEnabled: false,
                isSuiteSyncDebugEnabled: false,
                suiteSyncRelayUrl: null,
            } as any,
            'suiteSyncSettings',
        );
    }
});
