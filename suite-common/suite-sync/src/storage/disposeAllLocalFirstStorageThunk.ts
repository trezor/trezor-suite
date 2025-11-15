import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { unsubscribeAndDisposeLocalFirstStorageThunk } from './unsubscribeAndDisposeLocalFirstStorageThunk';

export const disposeAllLocalFirstStorageThunk = createThunk<void, void, void>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/disposeLocalFirstStorageThunk`,
    (_, { getState, dispatch }) => {
        // Intentionally `isLocalFirstStorageEnabled` check, as dispose will happen when the flag may be already off,
        // but we want to unsubscribe anyway

        const devices = selectDevices(getState());
        for (const device of devices) {
            if (isTrezorDeviceWithState(device)) {
                dispatch(unsubscribeAndDisposeLocalFirstStorageThunk({ device }));
            }
        }
    },
);
