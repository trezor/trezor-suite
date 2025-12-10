import { selectIsFirmwareInstallationRunning } from '@suite-common/firmware/src/firmwareReducer';
import { createThunk } from '@suite-common/redux-utils';
import { getIsThpDevice } from '@suite-common/suite-utils';
import { selectDevices } from '@suite-common/wallet-core/src/device/deviceSelectors';
import { acquireDevice } from '@suite-common/wallet-core/src/device/deviceThunks';
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
    if (!getIsThpDevice(device)) return;

    // This needs to be re-selected to convert Device to TrezorDevice.
    // This TrezorDevice will be there ready after the reducer fills data in.
    const reselectedTrezorDevice = selectDevices(getState())?.find(
        stateDevice => stateDevice.path === device.path,
    );

    if (!selectIsFirmwareInstallationRunning(getState())) {
        dispatch(acquireDevice({ requestedDevice: reselectedTrezorDevice }));
    }
});
