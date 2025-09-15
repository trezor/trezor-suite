import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('25.9.2', async (db, tx) => {
    if (!db.objectStoreNames.contains('security')) return;

    const store = tx.objectStore('security');
    const security = await store.get('security');

    if (security && 'devicesWithFailedEntropyCheck' in security) {
        delete security.devicesWithFailedEntropyCheck;
        await store.put(security, 'security');
    }
});
