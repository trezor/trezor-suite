import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// Remove desktop trading form drafts (trading-buy/*, trading-sell/, trading-exchange/)
export default createMigration<SuiteDBSchema>('26.6.0', async (_, tx) => {
    const store = tx.objectStore('formDrafts');
    const keys = await store.getAllKeys();
    const keysToDelete = keys.filter(key => typeof key === 'string' && key.startsWith('trading-'));

    await Promise.all(keysToDelete.map(key => store.delete(key)));
});
