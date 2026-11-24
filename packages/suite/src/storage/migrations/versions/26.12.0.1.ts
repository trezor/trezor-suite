import { createMigration } from '@suite/idb-migration-utils';
import { type PersistentDeviceData } from '@suite-common/suite-types';
import { generateDeviceKey } from '@suite-common/suite-utils';

import type { SuiteDBSchema } from '#src/storage/definitions';

import { updateAll } from '../utils';

type Descriptor = PersistentDeviceData['descriptors'][number];

type LegacyPersistentDeviceData = Omit<PersistentDeviceData, 'descriptors'> & {
    descriptor?: Descriptor;
    descriptors?: Descriptor[];
};

/*
 Replace the optional `descriptor` (persisted for Bluetooth devices only) of each `persistentDeviceData` entry
 with the `descriptors` array, and add a unique `key` to every remembered device.
*/
export default createMigration<SuiteDBSchema>('26.12.0.1', async (_, tx) => {
    const store = tx.objectStore('persistentDeviceData');
    const persistentData: LegacyPersistentDeviceData[] | undefined =
        await store.get('persistentDeviceData');

    if (Array.isArray(persistentData)) {
        const updated: PersistentDeviceData[] = persistentData.map(({ descriptor, ...entry }) => ({
            ...entry,
            descriptors: entry.descriptors ?? (descriptor ? [descriptor] : []),
        }));

        await store.put(updated, 'persistentDeviceData');
    }

    await updateAll(tx, 'devices', device => {
        if (!device.key) {
            device.key = generateDeviceKey();
        }

        return device;
    });
});
