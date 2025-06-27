import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('25.8.0', async (_db, transaction) => {
    await updateAll(transaction, 'devices', device => {
        if (device.authenticityChecks) return;
        device.authenticityChecks = {
            firmwareRevision: null,
            firmwareHash: null,
        };

        return device;
    });
});
