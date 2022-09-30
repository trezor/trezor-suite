import type { DBMigration } from './types';
import { updateAll } from './utils';

const VERSION = 15;

const migrate: DBMigration = async ({ db, oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    db.createObjectStore('metadata');

    await updateAll(transaction, 'accounts', account => {
        account.metadata = {
            key: '',
            fileName: '',
            aesKey: '',
            outputLabels: {},
            addressLabels: {},
        };
        account.key = `${account.descriptor}-${account.symbol}-${account.deviceState}`;
        return account;
    });

    await updateAll(transaction, 'devices', device => {
        device.metadata = {
            status: 'disabled',
        };
        return device;
    });
};

export default migrate;
