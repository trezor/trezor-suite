import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getStatus } from '@suite-common/suite-utils';
import { networkSymbolCollection } from '@suite-common/wallet-config';
import { getFirmwareVersion } from '@trezor/device-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

/**
 * @deprecated This is a HACK, and it shall be refactored. See: https://github.com/trezor/trezor-suite/issues/22022
 */
export const selectSelectedFirstThpDevice = (state: DeviceRootState) => {
    // Use the last one as its more probable you want to use that one. While neither is correct,
    // I assume you will more likely be trying to pair the more recent device.

    const unacquiredThp = state.device.devices.findLast(
        device => getStatus(device) === 'device-thp-locked',
    );

    // This works on heuristic, if there is unacquired THP device we assume we want to work with that device.
    // This is relevant during THP pairing.
    if (unacquiredThp !== undefined) {
        return unacquiredThp;
    }

    // In case there is no unacquired THP device, we still may be in a situation,
    // where we want to work with THP device. Currently, the use-case is `AutoconnectInfo` step,
    // where user works on (maybe) not-selected device, but the THP device is already acquired.
    return state.device.devices.findLast(device => device.thp?.properties !== undefined);
};

export const selectSupportedNetworkByDevice = (device: TrezorDevice | undefined) => {
    const firmwareVersion = getFirmwareVersion(device);
    const result = networkSymbolCollection.filter(symbol => {
        const unavailableCapability = device?.unavailableCapabilities?.[symbol];
        // if device does not have fw, do not show coins which are not supported by device in any case
        if (!firmwareVersion && unavailableCapability === 'no-support') {
            return false;
        }
        // if device has fw, do not show coins which are not supported by current fw
        if (
            firmwareVersion &&
            ['no-support', 'no-capability'].includes(unavailableCapability || '')
        ) {
            return false;
        }

        return true;
    });

    return returnStableArrayIfEmpty(result);
};

export const selectDeviceSupportedNetworks = createMemoizedSelector(
    [selectSelectedDevice],
    selectSupportedNetworkByDevice,
);
