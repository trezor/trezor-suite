import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// Extract discreetMode from walletSettings into its own object store
export default createMigration<SuiteDBSchema>('26.7.0', async (db, tx) => {
    db.createObjectStore('discreetMode');

    const walletSettingsStore = tx.objectStore('walletSettings');
    const walletSettings = await walletSettingsStore.get('wallet');

    // @ts-expect-error - discreetMode was removed from WalletSettings type
    const discreetMode: boolean = walletSettings?.discreetMode ?? false;

    const discreetModeStore = tx.objectStore('discreetMode');
    await discreetModeStore.put({ isActive: discreetMode }, 'discreetMode');

    if (walletSettings) {
        // @ts-expect-error - discreetMode was removed from WalletSettings type
        delete walletSettings.discreetMode;
        await walletSettingsStore.put(walletSettings, 'wallet');
    }
});
