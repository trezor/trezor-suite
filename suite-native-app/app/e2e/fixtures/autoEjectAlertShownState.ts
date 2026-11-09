import { PreloadedState } from '@suite-native-app/state';

/**
 *  State fragment that ensures that the auto eject alert is not shown
 */
export const autoEjectAlertShownState: PreloadedState = {
    appSettings: {
        shouldShowAutoEjectAlert: false,
        hasAutoEjectAlertBeenDisplayed: true,
    },
};
