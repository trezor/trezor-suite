import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.6.0.1', async (_, tx) => {
    await updateAll(tx, 'accounts', account => {
        if (['tsep', 'thod'].includes(account.symbol)) {
            return null;
        }

        return account;
    });
});
