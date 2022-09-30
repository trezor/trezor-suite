import type { DBMigration } from './types';
import { updateAll } from './utils';

const VERSION = 30;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    await updateAll(transaction, 'walletSettings', walletSettings => {
        if (walletSettings.bitcoinAmountUnit || !walletSettings) {
            return;
        }

        walletSettings.bitcoinAmountUnit = 0;
        return walletSettings;
    });
};

export default migrate;
