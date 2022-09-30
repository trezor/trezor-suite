import type { DBMigration, WalletWithBackends } from './types';
import type { State } from '@wallet-reducers/settingsReducer';
import type { BlockbookUrl } from '@wallet-types/backend';
import { updateAll } from './utils';

const VERSION = 25;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    await updateAll<
        'walletSettings',
        State & {
            blockbookUrls?: BlockbookUrl[];
        } & WalletWithBackends
    >(transaction, 'walletSettings', settings => {
        if (!settings.backends && settings.blockbookUrls) {
            settings.backends = settings.blockbookUrls.reduce<{ [key: string]: any }>(
                (backends, { coin, url, tor }) =>
                    tor // automatically torified backends should be omitted
                        ? backends
                        : {
                              ...backends,
                              [coin]: {
                                  type: 'blockbook',
                                  urls: [...(backends[coin]?.urls || []), url],
                              },
                          },
                {},
            );
            delete settings.blockbookUrls;
            return settings;
        }
    });
};

export default migrate;
