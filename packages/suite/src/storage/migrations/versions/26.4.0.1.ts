import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

const legacyEvmTestnetPathPrefix = "m/44'/1'/0'/0/";

export default createMigration<SuiteDBSchema>('26.4.0.1', async (_, tx) => {
    await updateAll(tx, 'accounts', account => {
        const shouldMigrateAccount =
            (account.symbol === 'tsep' || account.symbol === 'thod') &&
            account.accountType === 'normal' &&
            account.path.startsWith(legacyEvmTestnetPathPrefix);

        if (!shouldMigrateAccount) {
            return account;
        }

        account.accountType = 'legacy';

        return account;
    });
});
