import { PreloadedState } from '@suite-native/state';

/**
 *  State fragment that ensures that the device security checks are disabled.
 */
export const deviceChecksDisabledState: PreloadedState = {
    appSettings: {
        isDeviceAuthenticityCheckEnabled: false,
        isFirmwareRevisionCheckEnabled: false,
        isFirmwareHashCheckEnabled: false,
    },
};
