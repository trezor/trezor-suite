import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { initEvoluKeysThunk, selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { subscriptionStorage } from './sharedObjects';
import { subscribeLabelingUpdatesThunk } from '../labeling/subscribeLabelingUpdatesThunk';

type SubscribeLocalFirstStorageThunkParams = {
    device: TrezorDevice;
};

export const subscribeLocalFirstStorageThunk = createThunk<
    void,
    SubscribeLocalFirstStorageThunkParams,
    void
>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/subscribeLocalFirstStorageThunk`,
    async ({ device }, { dispatch, getState }) => {
        const deviceStaticSessionId = device.state?.staticSessionId;

        if (deviceStaticSessionId === undefined) {
            return;
        }

        if (subscriptionStorage[deviceStaticSessionId]) {
            console.error(
                `____${deviceStaticSessionId} was already subscribed! This shall NOT happen.`,
            );

            return;
        }

        console.log('____subscribeLabelingUpdatesThunk', deviceStaticSessionId);

        if (device.localFirstStorageSecret === undefined) {
            await dispatch(initEvoluKeysThunk({ device }));
        }

        // Reselect the device to get the correct secret (cipherKey)
        const reselectedDevice = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const evoluKeys = reselectedDevice?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        dispatch(subscribeLabelingUpdatesThunk({ evoluKeys, walletDescriptor }));
    },
);
