import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

import { removeNetwork } from '../networks/removeNetwork';

export default createMigration<SuiteDBSchema>('25.11.0.1', async (db, tx) => {
    if (!db.objectStoreNames.contains('labelingSettings')) {
        db.createObjectStore('labelingSettings');

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

    // Remove Holesky test network. Now there's Hoodi (tHOD) test network.
    // Note: Moved to 25.11.0.1 from 25.10.0 as it was added there after 25.10 release
    await removeNetwork(tx, 'thol');
});
