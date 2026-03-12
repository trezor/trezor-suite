import { goto } from '@suite/router';
import { selectDevices } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { setDeviceAutoEjectThunk } from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';


const AUTO_EJECT_PREFIX = '@suite/autoEject';

type SetAutoEjectEnabledThunkProps = { shouldEnable: boolean };

export const setAutoEjectEnabledThunk = createThunk<void, SetAutoEjectEnabledThunkProps, void>(
    `${AUTO_EJECT_PREFIX}/enableAutoEjectThunk`,
    async ({ shouldEnable }, { dispatch, getState }) => {
        // Disconnected devices are purged from local redux (awaited because the subsequent code may rely on updated deviceReducer state)
        await dispatch(setDeviceAutoEjectThunk({ shouldEnable }));

        if (!shouldEnable) {
            return;
        }

        // All devices, even connected ones, removed from persistent storage,
        // which means connected device are preserved in local redux.
        const allDevices = selectDevices(getState());
        allDevices.forEach(device => {
            dispatch(storageActions.forgetDevice(device));
        });

        const currentDevices = selectDevices(getState());
        const connectedDevices = currentDevices.filter(device => device.connected && device.state);

        if (connectedDevices.length === 0) {
            dispatch(goto({ routeName: 'suite-index' }));
        }
    },
);
