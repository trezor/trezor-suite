import { createMigration } from '@suite/idb-migration-utils';
import { typedObjectKeys } from '@trezor/utils';

import { LANGUAGES } from 'src/config/suite';
import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('25.8.0', async (db, tx) => {
    if (db.objectStoreNames.contains('suiteSettings')) {
        const store = tx.objectStore('suiteSettings');
        const suiteSettings = await store.get('suite');

        if (suiteSettings && suiteSettings.settings) {
            if (
                typeof suiteSettings.settings.language === 'string' &&
                suiteSettings.settings.language.length === 2
            ) {
                const languageKeys = typedObjectKeys(LANGUAGES);
                for (const key of languageKeys) {
                    if (key.startsWith(suiteSettings.settings.language)) {
                        suiteSettings.settings.language = key;
                        break;
                    }
                }
            }

            await store.put(suiteSettings, 'suite');
        }
    }

    await updateAll(tx, 'devices', device => {
        if (device.authenticityChecks) return;
        device.authenticityChecks = {
            firmwareRevision: null,
            firmwareHash: null,
        };

        return device;
    });
});
