import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from '../../definitions';

export default createMigration<SuiteDBSchema>('26.4.0', db => {
    db.createObjectStore('phishing');
});
