import { asGetter } from '@trezor/dependency-injection';

import type {
    DeviceAuthenticityCheckSettings,
    GetDeviceAuthenticityCheckSettings,
} from '../src/deviceAuthenticity';

export const mockGetDeviceAuthenticityCheckSettings = (
    settings: Partial<DeviceAuthenticityCheckSettings> = {},
): GetDeviceAuthenticityCheckSettings =>
    asGetter(() => ({
        isDeviceAuthenticityCheckEnabled: true,
        isUnlockedBootloaderAllowed: false,
        ...settings,
    }));
