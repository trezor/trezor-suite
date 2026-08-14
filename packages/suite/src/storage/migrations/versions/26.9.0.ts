import { createMigration } from '@suite/idb-migration-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type SuspiciousTransactionsFilter, type WalletSettings } from '@suite-common/wallet-types';

import { type SuiteDBSchema } from 'src/storage/definitions';

type WalletSettingsWithLegacyHideSuspiciousTransactions = WalletSettings & {
    hideSuspiciousTransactions?: Partial<Record<NetworkSymbol, boolean>>;
};

export default createMigration<SuiteDBSchema>('26.9.0', async (_db, tx) => {
    const store = tx.objectStore('walletSettings');
    // The stored value may still have the old shape, hence the widened type.
    const settings: WalletSettingsWithLegacyHideSuspiciousTransactions | undefined =
        await store.get('wallet');

    if (!settings) return;

    const { hideSuspiciousTransactions } = settings;

    if (!hideSuspiciousTransactions) return;

    // The per-network `hideSuspiciousTransactions` boolean was replaced by the per-network
    // `suspiciousTransactionsFilter` value; only enabled entries carry information.
    settings.suspiciousTransactionsFilter = Object.fromEntries(
        Object.entries(hideSuspiciousTransactions)
            .filter(([, isHidden]) => isHidden)
            .map(([symbol]): [string, SuspiciousTransactionsFilter] => [symbol, 'hideSuspicious']),
    );
    delete settings.hideSuspiciousTransactions;

    await store.put(settings, 'wallet');
});
