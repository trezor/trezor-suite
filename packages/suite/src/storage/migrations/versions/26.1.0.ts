import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

import { removeNetwork } from '../networks/removeNetwork';

export default createMigration<SuiteDBSchema>('26.1.0', async (_, tx) => {
    await removeNetwork(tx, 'tada');
});
