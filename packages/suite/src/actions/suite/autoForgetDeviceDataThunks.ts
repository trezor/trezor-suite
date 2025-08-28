import { createThunk } from '@suite-common/redux-utils';
import {
    forgetAllDevicesPersistentDataThunk,
    setAutoForgetDeviceData,
} from '@suite-common/wallet-core';

import { setAutoEjectEnabledThunk } from './autoEjectThunks';
const AUTO_FORGET_PREFIX = '@suite/autoForgetDeviceData';

type SetAutoForgetDeviceDataThunkProps = { enabled: boolean };

export const setAutoForgetDeviceDataThunk = createThunk<
    void,
    SetAutoForgetDeviceDataThunkProps,
    void
>(`${AUTO_FORGET_PREFIX}/setAutoForgetDeviceDataThunk`, ({ enabled }, { dispatch }) => {
    if (!enabled) {
        dispatch(setAutoForgetDeviceData(false));

        return;
    }

    dispatch(setAutoForgetDeviceData(true));
    dispatch(forgetAllDevicesPersistentDataThunk());

    // When you enable autoForget, also enable autoEject, but not the other way around, because
    // autoEject feature is a subset of autoForget feature, autoForget does not make sense without autoEject.
    dispatch(setAutoEjectEnabledThunk({ enabled }));
});
