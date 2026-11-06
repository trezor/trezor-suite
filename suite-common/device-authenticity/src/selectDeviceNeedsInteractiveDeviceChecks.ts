import {
    type PersistentDeviceDataRootState,
    selectDeviceNeedsManualCheck,
} from '@suite-common/persistent-device-data';
import type { DeviceAuthenticityCheckSettings, TrezorDevice } from '@suite-common/suite-types';

import { selectShouldCheckDeviceAuthenticity } from './selectShouldCheckDeviceAuthenticity';

/**
 * Whether Manual Device Check (MDC) or DAC are supported, enabled, but still unfinished for the device.
 */
export const selectDeviceNeedsInteractiveDeviceChecks = (
    state: PersistentDeviceDataRootState,
    device: TrezorDevice | undefined,
    settings: DeviceAuthenticityCheckSettings,
): boolean =>
    selectDeviceNeedsManualCheck(state, device) ||
    selectShouldCheckDeviceAuthenticity(state, device, settings);
