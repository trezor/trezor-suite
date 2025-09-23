import { PreloadedState } from '@suite-native/state';

/**
 *  State fragment that ensures that the device auto eject is enabled.
 */
export const deviceAutoEjectState: PreloadedState = { device: { isDeviceAutoEjectEnabled: true } };
