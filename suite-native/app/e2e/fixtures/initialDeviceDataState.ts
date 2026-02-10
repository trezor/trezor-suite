import { PreloadedState } from '@suite-native/state';

/**
 *  State fragment that ensures valid initial data for deviceReducer
 */
export const initialDeviceDataState: PreloadedState = {
    device: {
        devices: [],
        persistentDeviceData: [],
    },
};
