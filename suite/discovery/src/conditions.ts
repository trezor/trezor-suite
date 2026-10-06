import { type LocksRootState, selectIsDeviceLocked } from '@suite/locks';
import { type RouterRootState, selectRouterApp } from '@suite/router';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { isDeviceAcquired } from '@suite-common/suite-utils';

import { SHOULD_ROUTER_APP_START_DISCOVERY } from './config';

/**
 * Determines if current router app is one of those, where discovery should start.
 */
export const selectShouldRouterAppStartDiscovery = (state: RouterRootState) =>
    SHOULD_ROUTER_APP_START_DISCOVERY[selectRouterApp(state)];

type DeviceReadyRootState = DeviceRootState & LocksRootState;

/**
 * Determines if device is ready for discovery, either:
 * - unlocked
 * - edge case: locked, and just has been acquired. In that case, device-change is emitted right before acquireDeviceThunk ends (and unlocks the device).
 *   TODO investigate if the lock state can be synced sooner, so that this case can be removed.
 */
export const selectIsDeviceReadyToStartDiscovery = (
    state: DeviceReadyRootState,
    becomesAcquired: boolean,
): boolean => {
    const device = selectSelectedDevice(state);
    const isDeviceLocked = selectIsDeviceLocked(state);

    return (
        device?.connected == true &&
        isDeviceAcquired(device) &&
        (!isDeviceLocked || becomesAcquired)
    );
};
