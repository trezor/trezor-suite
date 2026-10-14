import { createMigration } from '@suite/idb-migration-utils';

import type { SuiteDBSchema } from 'src/storage/definitions';

/*
 Backfill successful `manualCheckResult` to all `persistentDeviceData` entries – if it's previously known devices,
 it is assumed that the user has used it intentionally.

 Note: migration moved from 26.5.0.2 to 26.11.0, because in the meantime, it was still possible to connect a device
 and avoid the Manual Device Check. In 26.11, all devices are required to pass it at least once.
*/
export default createMigration<SuiteDBSchema>('26.11.0', async (_, tx) => {
    const store = tx.objectStore('persistentDeviceData');
    const data = await store.get('persistentDeviceData');
    if (!Array.isArray(data)) return;

    const updated = data.map(entry => ({
        ...entry,
        manualCheckResult: { success: true as const },
    }));

    await store.put(updated, 'persistentDeviceData');
});
