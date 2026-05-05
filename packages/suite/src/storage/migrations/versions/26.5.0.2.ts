import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// Backfill successful `manualCheckResult` to all `persistentDeviceData` entries (all previously known devices are assumed confirmed)
export default createMigration<SuiteDBSchema>('26.5.0.2', async (_, tx) => {
    const store = tx.objectStore('persistentDeviceData');
    const data = await store.get('persistentDeviceData');
    if (!Array.isArray(data)) return;

    const updated = data.map(entry => ({
        ...entry,
        manualCheckResult: { success: true as const },
    }));

    await store.put(updated, 'persistentDeviceData');
});
