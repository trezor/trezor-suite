import type { DBMigration, WalletWithBackends } from './types';
import type { BackendSettings } from '@suite-common/wallet-types';
import type { Network } from '@wallet-types';
import type { State } from '@wallet-reducers/settingsReducer';
import { updateAll } from './utils';

const VERSION = 27;

const migrate: DBMigration = async ({ db, oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    const backendSettings = db.createObjectStore('backendSettings');

    await updateAll<'walletSettings', State & WalletWithBackends>(
        transaction,
        'walletSettings',
        settings => {
            const { backends = {}, ...rest } = settings;
            Object.entries(backends).forEach(([coin, { type, urls }]) => {
                const settings: BackendSettings = {
                    selected: type,
                    urls: {
                        [type]: urls,
                    },
                };
                backendSettings.add(settings, coin as Network['symbol']);
            });

            return rest;
        },
    );
};

export default migrate;
