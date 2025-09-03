import { createThunk } from '@suite-common/redux-utils';
import {
    forgetAllDevicesPersistentDataThunk,
    setAutoForgetDeviceData,
} from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

import { setAutoEjectEnabledThunk } from './autoEjectThunks';

const AUTO_FORGET_PREFIX = '@suite/autoForgetDeviceData';

type SetAutoForgetDeviceDataThunkProps = { enabled: boolean };

// TODO: move main parts of this thunk to wallet-core. The setting `autoForgetDeviceData` already lives in wallet-core.
// But the autoEject setting lives in suiteReducer unfortunately, so that will first have to be migrated to wallet-core.
export const setAutoForgetDeviceDataThunk = createThunk<
    void,
    SetAutoForgetDeviceDataThunkProps,
    void
>(`${AUTO_FORGET_PREFIX}/setAutoForgetDeviceDataThunk`, async ({ enabled }, { dispatch }) => {
    if (!enabled) {
        dispatch(setAutoForgetDeviceData(false));

        return;
    }

    dispatch(setAutoForgetDeviceData(true));
    await dispatch(forgetAllDevicesPersistentDataThunk());

    // When you enable autoForget, also enable autoEject, but not the other way around, because
    // autoEject feature is a subset of autoForget feature, autoForget does not make sense without autoEject.
    // This also takes care of forgetting wallets (as deviceReducer `devices`) from redux as well as storage.
    await dispatch(setAutoEjectEnabledThunk({ enabled }));

    // Finally, having purged the data in Bluetooth and THP reducers, simply sync BT and THP to persistent storage.
    dispatch(storageActions.saveKnownDevices());
    dispatch(storageActions.saveThpCredentials());
});
