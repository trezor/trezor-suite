import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { removeNetwork } from '../networks/removeNetwork';
import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.1.0', async (db, tx) => {
    await removeNetwork(tx, 'tada');

    db.createObjectStore('suiteSyncQuotaManager');

    tx.objectStore('suiteSyncQuotaManager').put(
        {
            baseUrl: null,
            registeredDevices: [],
            ownersAllowance: [],
            enforceQuotaManager: false,
        },
        'suiteSyncQuotaManager',
    );

    if (db.objectStoreNames.contains('thp')) {
        await updateAll(tx, 'thp', thp => {
            thp.credentials.forEach(cre => {
                // @ts-expect-error staticKey was removed
                cre.host_static_key = thp.staticKey;
            });

            return thp;
        });
    }
});
