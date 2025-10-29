import { createThunk } from '@suite-common/redux-utils';
import { setAutoForgetDeviceDataThunk as setAutoForgetDeviceDataThunkCore } from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

import { setAutoEjectEnabledThunk } from './autoEjectThunks';

const AUTO_FORGET_PREFIX = '@suite/autoForgetDeviceData';

type SetAutoForgetDeviceDataThunkProps = { shouldEnable: boolean };

export const setAutoForgetDeviceDataThunk = createThunk<
    void,
    SetAutoForgetDeviceDataThunkProps,
    void
>(`${AUTO_FORGET_PREFIX}/setAutoForgetDeviceDataThunk`, async ({ shouldEnable }, { dispatch }) => {
    await dispatch(setAutoForgetDeviceDataThunkCore({ shouldEnable }));

    if (!shouldEnable) {
        return;
    }

    await dispatch(setAutoEjectEnabledThunk({ shouldEnable: true }));

    // Finally, having purged the data in Bluetooth and THP reducers, simply sync BT and THP to persistent storage.
    dispatch(storageActions.saveKnownDevices());
    dispatch(storageActions.saveThpCredentials());
});
