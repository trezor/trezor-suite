import { createThunk } from '@suite-common/redux-utils';
import {
    accountsActions,
    discoveryActions,
    selectDevicelessAccounts,
    selectDevicelessDiscoveries,
} from '@suite-common/wallet-core';
import { clearAndUnlockDeviceAccessQueue } from '@suite-native/device-mutex';

const DEVICE_MODULE_PREFIX = '@suite-native/device';

export const wipeDisconnectedDevicesDataThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/wipeDisconnectedDevicesDataThunk`,
    (_, { getState, dispatch }) => {
        const devicelessAccounts = selectDevicelessAccounts(getState());
        const devicelessDiscoveries = selectDevicelessDiscoveries(getState());

        dispatch(accountsActions.removeAccount(devicelessAccounts));
        devicelessDiscoveries.forEach(discovery =>
            dispatch(discoveryActions.removeDiscovery(discovery.deviceState)),
        );

        clearAndUnlockDeviceAccessQueue();
    },
);
