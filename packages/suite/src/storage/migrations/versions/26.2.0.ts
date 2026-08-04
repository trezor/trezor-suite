import { createMigration } from '@suite/idb-migration-utils';
import { type GetNetworkConfigDep } from '@suite-common/networks';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default ({ getNetworkConfig }: GetNetworkConfigDep) =>
    createMigration<SuiteDBSchema>('26.2.0', async (_, tx) => {
        await updateAll(tx, 'txs', transaction => {
            if (getNetworkConfig(transaction.tx.symbol).features.includes('tokens')) {
                return null;
            }

            return transaction;
        });

        await updateAll(tx, 'accounts', account => {
            if (getNetworkConfig(account.symbol).features.includes('tokens')) {
                account.history = { total: 0, unconfirmed: 0, tokens: 0 };
            }

            return account;
        });
    });
