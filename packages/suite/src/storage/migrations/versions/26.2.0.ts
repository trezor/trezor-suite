import { createMigration } from '@suite/idb-migration-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

// Keep this historical migration independent of configurations added by later versions.
const tokenNetworks = new Set<NetworkSymbol>([
    'eth',
    'pol',
    'bsc',
    'arb',
    'base',
    'op',
    'rhc',
    'hype',
    'avax',
    'etc',
    'tsep',
    'thod',
    'ada',
    'sol',
    'dsol',
    'trx',
    'ttrx',
    'txrp',
    'xlm',
    'txlm',
]);

export default createMigration<SuiteDBSchema>('26.2.0', async (_, tx) => {
    await updateAll(tx, 'txs', transaction => {
        if (tokenNetworks.has(transaction.tx.symbol)) {
            return null;
        }

        return transaction;
    });

    await updateAll(tx, 'accounts', account => {
        if (tokenNetworks.has(account.symbol)) {
            account.history = { total: 0, unconfirmed: 0, tokens: 0 };
        }

        return account;
    });
});
