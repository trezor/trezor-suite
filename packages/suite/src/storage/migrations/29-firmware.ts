import type { DBMigration } from './types';
import { isDesktop } from '@suite-utils/env';
import { updateAll } from './utils';

const VERSION = 29;

const migrate: DBMigration = async ({ db, oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    db.createObjectStore('firmware');

    await updateAll(transaction, 'metadata', state => {
        // @ts-expect-error (token property removed)
        if (state.provider?.token) {
            if (isDesktop()) {
                state.provider.tokens = {
                    accessToken: '',
                    // @ts-expect-error
                    refreshToken: state.provider.token,
                };
            }
            // @ts-expect-error
            delete state.provider.token;
            return state;
        }
    });
};

export default migrate;
