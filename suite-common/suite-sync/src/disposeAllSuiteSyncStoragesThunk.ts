import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { SUITE_SYNC_STORAGE_PREFIX } from './constants';
import { unsubscribeAndDisposeSuiteSyncStorageThunk } from './unsubscribeAndDisposeSuiteSyncStorageThunk';

export const disposeAllSuiteSyncStoragesThunk = createThunk<void, void, void>(
    `${SUITE_SYNC_STORAGE_PREFIX}/disposeAllSuiteSyncStoragesThunk`,
    (_, { getState, dispatch }) => {
        // Intentionally `isSuiteSyncEnabled` check, as dispose will happen when the flag may be already off,
        // but we want to unsubscribe anyway

        const devices = selectDevices(getState());
        for (const device of devices) {
            if (isTrezorDeviceWithState(device)) {
                dispatch(unsubscribeAndDisposeSuiteSyncStorageThunk({ device }));
            }
        }
    },
);
