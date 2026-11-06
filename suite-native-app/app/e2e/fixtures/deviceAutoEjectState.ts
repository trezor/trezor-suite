import { PreloadedState } from '@suite-native-app/state';

/**
 *  State fragment that ensures that the device auto eject is enabled.
 */
export const deviceAutoEjectState: PreloadedState = {
    wallet: {
        settings: {
            isAutoEjectEnabled: true,
        },
    },
};
