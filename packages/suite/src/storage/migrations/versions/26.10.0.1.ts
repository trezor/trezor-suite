import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.10.0.1', async (_db, tx) => {
    const store = tx.objectStore('suiteSettings');
    const suiteSettings = await store.get('suite');

    if (!suiteSettings) return;

    // @ts-expect-error The flag was removed together with the stablecoin yield dashboard banner.
    delete suiteSettings.flags.showStablecoinYieldDashboardPromoBanner;

    await store.put(suiteSettings, 'suite');
});
