import type { DBMigration } from './types';
import { updateAll } from './utils';

const VERSION = 18;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    await updateAll(transaction, 'devices', device => {
        device.walletNumber = device.instance;
        return device;
    });
};

export default migrate;
