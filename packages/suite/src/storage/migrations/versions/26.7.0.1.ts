import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// Extract the debug menu visibility flag from suiteSettings.debug into its own object store
export default createMigration<SuiteDBSchema>('26.7.0.1', async (db, tx) => {
    db.createObjectStore('debug');

    const suiteSettingsStore = tx.objectStore('suiteSettings');
    const suiteSettings = await suiteSettingsStore.get('suite');

    // @ts-expect-error - showDebugMenu was removed from DebugModeOptions type
    const showDebugMenu: boolean = suiteSettings?.settings?.debug?.showDebugMenu ?? false;

    await tx.objectStore('debug').put({ showDebugMenu }, 'debug');

    if (suiteSettings?.settings?.debug) {
        // @ts-expect-error - showDebugMenu was removed from DebugModeOptions type
        delete suiteSettings.settings.debug.showDebugMenu;
        await suiteSettingsStore.put(suiteSettings, 'suite');
    }
});
