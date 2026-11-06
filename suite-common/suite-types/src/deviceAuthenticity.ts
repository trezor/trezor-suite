import { type Getter } from '@trezor/dependency-injection';

/**
 * App-specific settings affecting whether Device Authenticity Check (DAC) is performed.
 */
export type DeviceAuthenticityCheckSettings = {
    isDeviceAuthenticityCheckEnabled: boolean;
    // DAC always fails for a device with unlocked bootloader, so tolerating it effectively skips the check.
    isUnlockedBootloaderAllowed: boolean;
};

export type GetDeviceAuthenticityCheckSettings = Getter<[], DeviceAuthenticityCheckSettings>;

export type GetDeviceAuthenticityCheckSettingsDep = {
    getDeviceAuthenticityCheckSettings: GetDeviceAuthenticityCheckSettings;
};

export const injectGetDeviceAuthenticityCheckSettings = (
    services: any,
): GetDeviceAuthenticityCheckSettingsDep => ({
    getDeviceAuthenticityCheckSettings: services.getDeviceAuthenticityCheckSettings,
});
