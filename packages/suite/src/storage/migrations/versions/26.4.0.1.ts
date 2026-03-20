import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { removePersistedNetworkData } from '../networks/removeNetwork';

const migratedNetworkSymbols = ['tsep', 'thod'] as const;

export default createMigration<SuiteDBSchema>('26.4.0.1', async (_, tx) => {
    for (const networkSymbol of migratedNetworkSymbols) {
        await removePersistedNetworkData(tx, networkSymbol);
    }
});
