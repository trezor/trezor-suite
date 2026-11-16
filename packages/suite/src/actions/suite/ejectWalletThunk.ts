import {
    type DeviceRootState,
    deviceActions,
    selectDeviceThunk,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { getFirstDeviceInstance, isSelectedInstance } from '@suite-common/suite-utils';
import { createThunk } from '@trezor/redux-utils';

type EjectWalletThunkParams = {
    device: AcquiredDevice;
};

type EjectWalletThunkState = DeviceRootState;

export const ejectWalletThunk = createThunk<
    void,
    EjectWalletThunkParams,
    { state: EjectWalletThunkState }
>('@suite/eject-wallet', ({ device }, { dispatch, getState }) => {
    const isEjectingSelectedWallet = isSelectedInstance(selectSelectedDevice(getState()), device);

    dispatch(deviceActions.forgetDevice({ device }));

    // A connected device keeps its last instance without a wallet and stays selected, so the
    // discovery started when the switcher closes would open the ejected wallet again.
    if (!isEjectingSelectedWallet || selectSelectedDevice(getState())?.state) return;

    const [nextWallet] = getFirstDeviceInstance(
        selectDevices(getState()).filter(candidate => candidate.state),
    );
    if (nextWallet) {
        dispatch(selectDeviceThunk({ device: nextWallet }));
    }
});
