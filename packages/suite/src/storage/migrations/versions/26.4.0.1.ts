import { createMigration } from '@suite/idb-migration-utils';
import { type FeatureFeedbackState } from '@suite-common/feedback';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.4.0.1', async (db, tx) => {
    db.createObjectStore('phishingMetadata');

    await updateAll(tx, 'devices', device => {
        // Ensure apiType is set for remembered devices from old versions of Suite.
        // Bluetooth didn't exist before, so defaulting to 'usb' is safe.
        if (!device.descriptor) {
            device.descriptor = { apiType: 'usb' };

            return device;
        }

        if (!device.descriptor.apiType) {
            device.descriptor.apiType = 'usb';

            return device;
        }
    });

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
