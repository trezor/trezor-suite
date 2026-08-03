import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.8.0.2', async (_db, tx) => {
    const store = tx.objectStore('walletSettings');
    const settings = await store.get('wallet');

    if (!settings) return;

    // The stored value may still have the old shape, hence the widening cast.
    const { hideSuspiciousTransactions } = settings as { hideSuspiciousTransactions: unknown };

    if (typeof hideSuspiciousTransactions !== 'boolean') return;

    // The setting used to be a single boolean applied to all networks; it is now stored
    // per network. A stored `true` is preserved for all networks the user has enabled.
    settings.hideSuspiciousTransactions = hideSuspiciousTransactions
        ? Object.fromEntries(settings.enabledNetworks.map(symbol => [symbol, true]))
        : {};

    await store.put(settings, 'wallet');
});
