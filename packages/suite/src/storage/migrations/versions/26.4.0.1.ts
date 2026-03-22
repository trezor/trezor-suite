import { createMigration } from '@suite/idb-migration-utils';
import { type FeatureFeedbackState } from '@suite-common/feedback';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.4.0.1', async (db, tx) => {
    if (!db.objectStoreNames.contains('featureFeedback')) {
        db.createObjectStore('featureFeedback');
    }

    // @ts-expect-error experimentalFeedback no longer exists in the schema
    if (db.objectStoreNames.contains('experimentalFeedback')) {
        const oldStore = tx.objectStore(
            // @ts-expect-error experimentalFeedback no longer exists in the schema
            'experimentalFeedback',
        );
        const oldData = (await oldStore.get('experimentalFeedback')) as
            | FeatureFeedbackState
            | undefined;

        if (oldData) {
            tx.objectStore('featureFeedback').put(oldData, 'featureFeedback');
        }

        // @ts-expect-error experimentalFeedback no longer exists in the schema
        db.deleteObjectStore('experimentalFeedback');
    }
});
