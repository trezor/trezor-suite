import { selectFirmware } from '@suite-common/firmware/src/firmwareReducer';
import { createThunk } from '@suite-common/redux-utils';
import { isThpDevice } from '@suite-common/suite-utils';
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
    if (!isThpDevice(device)) return;
    const isFwInstall = selectFirmware(getState()).status !== 'initial';

    // This needs to be re-selected to convert Device to TrezorDevice.
    // This TrezorDevice will be there ready after the reducer fills data in.
    const reselectedTrezorDevice = selectDevices(getState())?.find(
        stateDevice => stateDevice.path === device.path,
    );
    // TODO: To be fixed properly in https://github.com/trezor/trezor-suite/issues/20930
    if (!isFwInstall) {
        dispatch(acquireDevice({ requestedDevice: reselectedTrezorDevice }));
    }
});
