import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';

import { DEFAULT_SUITE_SYNC_RELAY_URL } from './LocalFirstStorageProvider';
import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { getLocalFirstStorageProvider } from './sharedObjects';
import { labelingActions } from '../labeling/labelingActions';

type ChangeRelayUrlThunkThunkParams = {
    relayUrl: string | null;
};

export const changeRelayUrlThunk = createThunk<void, ChangeRelayUrlThunkThunkParams, void>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/changeRelayUrlThunk`,
    async ({ relayUrl }, { getState, dispatch }) => {
        const devices = selectDevices(getState());
        dispatch(labelingActions.setLocalFirstStorageRelayUrl({ url: relayUrl }));

        // We save empty, but we need to reconnect to DEFAULT in case user clears relay form to empty
        const normalizedUrl =
            relayUrl === null || relayUrl.trim() === '' ? DEFAULT_SUITE_SYNC_RELAY_URL : relayUrl;

        for (const device of devices) {
            const evoluKeys = device.localFirstStorageSecret?.evoluKeys;

            if (evoluKeys === undefined) {
                continue;
            }

            await getLocalFirstStorageProvider(evoluKeys).updateRelayUrl(normalizedUrl);
        }
    },
);
