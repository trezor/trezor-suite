import { selectFirmware } from '@suite-common/firmware/src/firmwareReducer';
import { createThunk } from '@suite-common/redux-utils';
import { acquireDevice, selectDevices } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

type AutoInitThpAfterDeviceConnectionThunkParams = {
    device: Device;
};

export const autoInitThpAfterDeviceConnectionThunk = createThunk<
    void,
    AutoInitThpAfterDeviceConnectionThunkParams,
    void
>(`${THP_PREFIX}/autoInitThpAfterDeviceConnectionThunk`, ({ device }, { dispatch, getState }) => {
    const isFwInstall = selectFirmware(getState()).status !== 'initial';

    // This needs to be re-selected to convert Device to TrezorDevice.
    // This TrezorDevice will be there ready after the reducer fills data in.
    const reselectedTrezorDevice = selectDevices(getState())?.find(
        stateDevice => stateDevice.path === device.path,
    );

    if (device?.thp !== undefined && !isFwInstall) {
        dispatch(acquireDevice({ requestedDevice: reselectedTrezorDevice }));
    }
});
