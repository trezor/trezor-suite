import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.8.0.3', db => {
    // The stores may already exist when this migration runs again under a new version number, as
    // a draft migration renumbered on rebase does. Creating an existing store aborts the upgrade.
    if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts');
    }

    if (!db.objectStoreNames.contains('contactsDeviceAuthority')) {
        db.createObjectStore('contactsDeviceAuthority');
    }
});
