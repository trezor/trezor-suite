import { PreloadedState } from '@suite-native/state';

/**
 *  State fragment that ensures that the device security checks are enabled.
 */
export const deviceChecksEnabledState: PreloadedState = {
    appSettings: {
        isDeviceAuthenticityCheckEnabled: true,
        isFirmwareRevisionCheckEnabled: true,
        isFirmwareHashCheckEnabled: true,
        areDeviceMetaChecksEnabled: true,
    },
};
