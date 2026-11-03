import { createMigration } from '@suite/idb-migration-utils';
import { generateTradeApiInstallSalt } from '@suite-common/trading';

import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.11.0.2', async (db, tx) => {
    db.createObjectStore('tradeApiInstallSalt');

    await tx
        .objectStore('tradeApiInstallSalt')
        .put(generateTradeApiInstallSalt(), 'tradeApiInstallSalt');
});
