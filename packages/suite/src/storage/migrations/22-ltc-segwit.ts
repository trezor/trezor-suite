import type { DBMigration } from './types';
import { updateAll } from './utils';

const VERSION = 22;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    await updateAll(transaction, 'accounts', account => {
        if (account.symbol === 'ltc' && account.accountType === 'normal') {
            // change account type from normal to segwit
            account.accountType = 'segwit';
            return account;
        }
    });

    await updateAll(transaction, 'discovery', d => {
        // reset discovery
        if (d.networks.includes('ltc')) {
            d.index = 0;
            d.loaded = 0;
            return d;
        }
    });
};

export default migrate;
