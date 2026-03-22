import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.4.0.1', async (db, tx) => {
    if (!db.objectStoreNames.contains('featureFeedback')) {
        db.createObjectStore('featureFeedback');
    }

    // @ts-expect-error experimentalFeedback no longer exists in the schema
    if (db.objectStoreNames.contains('experimentalFeedback')) {
        // @ts-expect-error experimentalFeedback no longer exists in the schema
        const oldData = await tx.objectStore('experimentalFeedback').get('experimentalFeedback');

        if (oldData) {
            tx.objectStore('featureFeedback').put(oldData, 'featureFeedback');
        }

        // @ts-expect-error experimentalFeedback no longer exists in the schema
        db.deleteObjectStore('experimentalFeedback');
    }
});
