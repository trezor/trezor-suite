import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { typedObjectValues } from '@trezor/utils';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { localFirstStorageProvider, subscriptionStorage } from './sharedObjects';
import { createOwnerIdFromEvoluKeys } from '../evoluUtils';

type UnsubscribeLocalFirstStorageThunkParams = {
    device: TrezorDevice;
};

export const unsubscribeAndDisposeLocalFirstStorageThunk = createThunk<
    void,
    UnsubscribeLocalFirstStorageThunkParams,
    void
>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/unsubscribeLocalFirstStorageThunk`,
    ({ device }, { rejectWithValue }) => {
        if (localFirstStorageProvider === null) {
            throw new Error(
                "throw Error('initLocalFirstStorageThunk() must be called before this!');",
            );
        }

        const deviceStaticSessionId = device.state?.staticSessionId;

        if (deviceStaticSessionId === undefined) {
            return;
        }

        const evoluKeys = device.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        const ownerIdResult = createOwnerIdFromEvoluKeys(evoluKeys);
        if (!ownerIdResult.ok) {
            return rejectWithValue(ownerIdResult.error);
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        typedObjectValues(subscriptionStorage[walletDescriptor]).forEach(callback => callback?.());

        delete subscriptionStorage[walletDescriptor];
        localFirstStorageProvider.deleteStorage(ownerIdResult.value);
    },
);
