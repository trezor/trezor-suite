import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { DeviceState, StaticSessionId } from '@trezor/connect';

import { DiscoveryRootState } from './discoveryReducer';
import { DeviceRootState } from '../device/deviceReducer';
import { selectSelectedDevice } from '../device/deviceSelectors';

export const selectDiscovery = (state: DiscoveryRootState) => state.wallet.discovery;

// Get discovery process for deviceState.
export const selectDiscoveryByDeviceState = (
    state: DiscoveryRootState,
    deviceState: DeviceState | StaticSessionId | undefined | null,
) =>
    deviceState
        ? state.wallet.discovery.find(d =>
              typeof deviceState === 'string'
                  ? d.deviceState === deviceState
                  : d.deviceState === deviceState.staticSessionId,
          )
        : undefined;

export const selectDeviceDiscovery = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);

    return selectDiscoveryByDeviceState(state, selectedDevice?.state?.staticSessionId);
};

export const selectIsDiscoveryActiveByDeviceState = (
    state: DiscoveryRootState & DeviceRootState,
    deviceState: DeviceState | StaticSessionId | undefined | null,
) => {
    const discovery = selectDiscoveryByDeviceState(state, deviceState);

    if (!discovery) return false;

    return (
        discovery.status === DiscoveryStatus.RUNNING ||
        discovery.status === DiscoveryStatus.STOPPING
    );
};

export const selectIsDeviceDiscoveryActive = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDeviceDiscovery(state);

    return selectIsDiscoveryActiveByDeviceState(state, discovery?.deviceState);
};

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDeviceDiscovery(state);

    return (
        discovery &&
        discovery.authConfirm &&
        (discovery.status < DiscoveryStatus.STOPPING ||
            discovery.status === DiscoveryStatus.COMPLETED)
    );
};

export const selectHasDeviceDiscovery = (state: DiscoveryRootState & DeviceRootState) =>
    !!selectDeviceDiscovery(state);
