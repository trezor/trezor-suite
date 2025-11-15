import { createThunk } from '@suite-common/redux-utils';
import { TrezorDeviceWithState } from '@suite-common/suite-types';
import { selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';
import { initEvoluKeysThunk } from './initEvoluKeysThunk';
import { isSuiteSyncSupportedByDevice } from '../device';
import { subscribeLabelingUpdatesThunk } from '../labeling/subscribeLabelingUpdatesThunk';

type SubscribeLocalFirstStorageThunkParams = {
    device: TrezorDeviceWithState;
};

export const subscribeLocalFirstStorageThunk = createThunk<
    void,
    SubscribeLocalFirstStorageThunkParams,
    void
>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/subscribeLocalFirstStorageThunk`,
    async ({ device }, { dispatch, getState }) => {
        if (!isSuiteSyncSupportedByDevice(device)) {
            return;
        }

        const deviceStaticSessionId = device.state.staticSessionId;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        if (device.localFirstStorageSecret?.evoluKeys === undefined) {
            await dispatch(initEvoluKeysThunk({ device }));
        }

        // Reselect the device to get the correct secret (cipherKey)
        const reselectedDevice = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const evoluKeys = reselectedDevice?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            console.error(
                'Evolu: Keys set to reselectedDevice',
                reselectedDevice?.localFirstStorageSecret,
            );

            return;
        }

        dispatch(subscribeLabelingUpdatesThunk({ evoluKeys, walletDescriptor }));
    },
);
