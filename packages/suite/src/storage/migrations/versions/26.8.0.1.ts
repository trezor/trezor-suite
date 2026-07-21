import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.8.0.1', async (_db, tx) => {
    const rememberedDeviceStates = new Set(await tx.objectStore('devices').getAllKeys());
    const accounts = await tx.objectStore('accounts').getAll();
    const rememberedAccountKeys = new Set(
        accounts
            .filter(account => rememberedDeviceStates.has(account.deviceState))
            .map(account => account.key),
    );

    const receiveStore = tx.objectStore('receive');
    let cursor = await receiveStore.openCursor();

    while (cursor) {
        if (!rememberedAccountKeys.has(cursor.key)) {
            await cursor.delete();
        }

        cursor = await cursor.continue();
    }
});
