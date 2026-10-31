import { type DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { createThunk } from '@trezor/redux-utils';

import { DISCOVERY_MODULE_PREFIX } from './discoveryActions';
import { type DiscoveryRootState } from './discoveryReducer';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import { cancelDiscoveryForRestartThunk, startDiscoveryThunk } from './discoveryThunks';
import { forgetDisconnectedDevicesThunk } from '../device/deviceThunks';

type EjectAllWalletsThunkParams = {
    device: TrezorDevice;
};

export type EjectAllWalletsThunkState = DeviceRootState & DiscoveryRootState;

/**
 * Ejects all wallets of the device (standard as well as passphrases, but persistentDeviceData are kept).
 * Used when the discovery entropy check failed: the device has returned a different xpub than during wallet creation,
 * but the user is dismissing the check and wants to continue (at their own risk!).
 * Rediscovery may clear the check – if the device returns the correct xpubs this time.
 * If xpubs are wrong again, the Device Compromised screen won't pop up again (was intentionally dismissed by user).
 *
 * Note that even when only one bip44 path has failed, nothing the device has returned so far can be trusted → eject all.
 * Suite UI may end up in a state where discovery needs to be manually triggered → TODO investigate and fix,
 * but robustness and code simplicity has priority over smooth UX for this edge case (dismissing a failed check).
 */
export const ejectAllWalletsThunk = createThunk<
    void,
    EjectAllWalletsThunkParams,
    { state: EjectAllWalletsThunkState }
>(`${DISCOVERY_MODULE_PREFIX}/ejectAllWallets`, async ({ device }, { dispatch, getState }) => {
    // Cancel, so that the running discovery doesn't recreate accounts of the ejected wallets.
    if (isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
        await dispatch(cancelDiscoveryForRestartThunk(device));
    }

    // Despite the name, it forgets all wallets of the device regardless of connection when forced.
    // Unlike `forgetDeviceThunk`, it keeps the persistent device data.
    await dispatch(forgetDisconnectedDevicesThunk({ device, forceForget: true }));

    // try to start discovery with standard wallet
    dispatch(startDiscoveryThunk({ device, trigger: 'device-check' }));
});
