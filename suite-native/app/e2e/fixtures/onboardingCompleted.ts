import { PreloadedState } from '@suite-native/state';

export const onboardingCompleted: PreloadedState = {
    appSettings: {
        isOnboardingFinished: true,
        isCoinEnablingInitFinished: false,
        isDeviceAuthenticityCheckEnabled: true,
        isFirmwareRevisionCheckEnabled: true,
        isFirmwareHashCheckEnabled: true,
        areTestnetsEnabled: true,
        hasAutoEjectAlertBeenDisplayed: true,
    },
};
