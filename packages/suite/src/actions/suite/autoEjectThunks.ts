import { type GotoThunkDeps, type GotoThunkState, goto } from '@suite/router';
import { selectDevices } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    type SetDeviceAutoEjectThunkState,
    setDeviceAutoEjectThunk,
} from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

const AUTO_EJECT_PREFIX = '@suite/autoEject';

type SetAutoEjectEnabledThunkProps = { shouldEnable: boolean };

type SetAutoEjectEnabledThunkState = GotoThunkState & SetDeviceAutoEjectThunkState;

type SetAutoEjectEnabledThunkDeps = GotoThunkDeps;

export const setAutoEjectEnabledThunk = createThunk<
    void,
    SetAutoEjectEnabledThunkProps,
    { state: SetAutoEjectEnabledThunkState; extra: SetAutoEjectEnabledThunkDeps }
>(`${AUTO_EJECT_PREFIX}/enableAutoEjectThunk`, async ({ shouldEnable }, { dispatch, getState }) => {
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
});
