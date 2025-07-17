import { createMigration } from '@suite/idb-migration-utils';

import { LANGUAGES } from 'src/config/suite';
import type { Locale } from 'src/config/suite/languages';
import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('25.8.0', async (db, tx) => {
    if (db.objectStoreNames.contains('suiteSettings')) {
        const store = tx.objectStore('suiteSettings');
        const settings = await store.get('suite');

        if (settings && settings.settings) {
            if (
                typeof settings.settings.language === 'string' &&
                settings.settings.language.length === 2
            ) {
                const languageKeys = Object.keys(LANGUAGES) as Locale[];
                for (const key of languageKeys) {
                    if (key.startsWith(settings.settings.language)) {
                        settings.settings.language = key;
                        break;
                    }
                }
            }

            await store.put(settings, 'suite');
        }
    }

    await updateAll(transaction, 'devices', device => {
        if (device.authenticityChecks) return;
        device.authenticityChecks = {
            firmwareRevision: null,
            firmwareHash: null,
        };

        return device;
    });
});
