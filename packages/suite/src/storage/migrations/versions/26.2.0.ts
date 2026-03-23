import { createMigration } from '@suite/idb-migration-utils';
import { getNetwork } from '@suite-common/wallet-config';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.2.0', async (_, tx) => {
    await updateAll(tx, 'txs', transaction => {
        if (getNetwork(transaction.tx.symbol).features.includes('tokens')) {
            return null;
        }

        return transaction;
    });

    await updateAll(tx, 'accounts', account => {
        if (getNetwork(account.symbol).features.includes('tokens')) {
            account.history = { total: 0, unconfirmed: 0, tokens: 0 };
        }

        return account;
    });
});
