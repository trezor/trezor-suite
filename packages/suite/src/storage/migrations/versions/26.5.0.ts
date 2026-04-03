import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

const TREZOR_SERVER_URLS = [
    'https://suite-sync-dev.suite.sldev.cz/evolu/',
    'https://suite-sync.trezor.io/evolu/',
];

const isKnownTrezorServer = (url: string) =>
    TREZOR_SERVER_URLS.some(server => url.trim().toLowerCase() === server.trim().toLowerCase());

export default createMigration<SuiteDBSchema>('26.5.0', async (_db, tx) => {
    const store = tx.objectStore('suiteSyncSettings');
    const existing = await store.get('suiteSyncSettings');

    if (!existing) return;

    const oldUrl = (existing as any).suiteSyncRelayUrl as string | null;

    const suiteSyncServer =
        oldUrl === null || oldUrl.trim() === '' || isKnownTrezorServer(oldUrl)
            ? { type: 'default' as const, customUrl: null }
            : { type: 'custom' as const, customUrl: oldUrl };

    delete (existing as any).suiteSyncRelayUrl;
    (existing as any).suiteSyncServer = suiteSyncServer;

    await store.put(existing, 'suiteSyncSettings');
});
