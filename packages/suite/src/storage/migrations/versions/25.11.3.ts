import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('25.11.3', async (_, tx) => {
    if (tx.objectStoreNames.contains('graph')) {
        await updateAll(tx, 'graph', graph => {
            if (['ada', 'tada'].includes(graph.account.symbol)) {
                return null;
            }

            return graph;
        });
    }
});
