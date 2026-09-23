import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

// What the asset table was left showing, in a store of its own
export default createMigration<SuiteDBSchema>('26.10.0.2', db => {
    db.createObjectStore('assetTable');
});
