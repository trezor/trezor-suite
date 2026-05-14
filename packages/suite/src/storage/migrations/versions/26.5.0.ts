import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.5.0', async (_, tx) => {
    await updateAll(tx, 'accounts', account => {
        if (account.networkType === 'ethereum') {
            account.misc.nonce = '-1';

            return account;
        }
    });
});
