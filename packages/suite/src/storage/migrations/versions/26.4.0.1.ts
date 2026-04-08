import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.4.0.1', async (db, tx) => {
    db.createObjectStore('phishingMetadata');

    await updateAll(tx, 'devices', device => {
        // Ensure apiType is set for remembered devices from old versions of Suite.
        // Bluetooth didn't exist before, so defaulting to 'usb' is safe.
        if (!device.descriptor) {
            device.descriptor = { apiType: 'usb' };

            return device;
        }

        if (!device.descriptor.apiType) {
            device.descriptor.apiType = 'usb';

            return device;
        }
    });
});
