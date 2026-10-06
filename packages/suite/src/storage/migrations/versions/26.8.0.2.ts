import { createMigration } from '@suite/idb-migration-utils';
import { type WalletSettings } from '@suite-common/wallet-types';

import { type SuiteDBSchema } from 'src/storage/definitions';

type WalletSettingsWithLegacyHideSuspiciousTransactions = WalletSettings & {
    hideSuspiciousTransactions?: unknown;
};

export default createMigration<SuiteDBSchema>('26.8.0.2', async (_db, tx) => {
    const store = tx.objectStore('walletSettings');
    // The stored value may still have the old shape, hence the widened type.
    const settings: WalletSettingsWithLegacyHideSuspiciousTransactions | undefined =
        await store.get('wallet');

    if (!settings) return;

    const { hideSuspiciousTransactions } = settings;

    if (typeof hideSuspiciousTransactions !== 'boolean') return;

    // The setting used to be a single boolean applied to all networks; it is now stored
    // per network. A stored `true` is preserved for all networks the user has enabled.
    settings.hideSuspiciousTransactions = hideSuspiciousTransactions
        ? Object.fromEntries(settings.enabledNetworks.map(symbol => [symbol, true]))
        : {};

    await store.put(settings, 'wallet');
});
