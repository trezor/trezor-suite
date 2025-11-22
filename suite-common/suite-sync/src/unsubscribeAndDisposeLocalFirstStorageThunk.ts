import { OwnerId } from '@evolu/common';

import { createThunk } from '@suite-common/redux-utils';
import { localFirstStorageProvider, subscriptionStorage } from '@suite-common/suite-sync-storage';
import { TrezorDeviceWithState } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { typedObjectValues } from '@trezor/utils';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';

type UnsubscribeLocalFirstStorageThunkParams = {
    device: TrezorDeviceWithState;
};

export const unsubscribeAndDisposeLocalFirstStorageThunk = createThunk<
    void,
    UnsubscribeLocalFirstStorageThunkParams,
    void
>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/unsubscribeLocalFirstStorageThunk`,
    async ({ device }, { rejectWithValue }) => {
        if (localFirstStorageProvider === null) {
            throw new Error("initLocalFirstStorageThunk() must be called before this!'");
        }

        const deviceStaticSessionId = device.state.staticSessionId;

        const evoluKeys = device.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        const ownerIdResult = OwnerId.from(evoluKeys.ownerId);

        if (!ownerIdResult.ok) {
            return rejectWithValue(ownerIdResult.error);
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        typedObjectValues(subscriptionStorage[walletDescriptor]).forEach(callback => callback?.());

        delete subscriptionStorage[walletDescriptor];
        await localFirstStorageProvider.deleteStorage(ownerIdResult.value);
    },
);
