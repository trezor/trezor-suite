import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';

import { DEFAULT_SUITE_SYNC_RELAY_URL, SUITE_SYNC_STORAGE_PREFIX } from './constants';
import { setSuiteSyncRelayUrl } from './suiteSyncActions';

type ChangeRelayUrlThunkThunkParams = {
    relayUrl: string | null;
};

export const changeRelayUrlThunk = createThunk<void, ChangeRelayUrlThunkThunkParams, void>(
    `${SUITE_SYNC_STORAGE_PREFIX}/changeRelayUrlThunk`,
    async ({ relayUrl }, { getState, dispatch, extra: { services } }) => {
        const devices = selectDevices(getState());
        dispatch(setSuiteSyncRelayUrl({ url: relayUrl }));

        // We save empty, but we need to reconnect to DEFAULT in case user clears relay form to empty
        const normalizedUrl =
            relayUrl === null || relayUrl.trim() === '' ? DEFAULT_SUITE_SYNC_RELAY_URL : relayUrl;

        for (const device of devices) {
            const owner = device.suiteSyncOwner;

            if (owner === undefined) {
                continue;
            }

            await services.suiteSync.suiteSyncStorageRepository
                .get(owner)
                .updateRelayUrl(normalizedUrl);
        }
    },
);
