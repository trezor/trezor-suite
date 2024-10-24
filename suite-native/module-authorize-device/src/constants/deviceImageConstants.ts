import { DeviceModelInternal } from '@trezor/connect';

export const deviceImageMap: Record<DeviceModelInternal, string> = {
    [DeviceModelInternal.T1B1]: require('../assets/connect/pin-t1b1.png'),
    [DeviceModelInternal.T2T1]: require('../assets/connect/pin-t2t1.png'),
    [DeviceModelInternal.T2B1]: require('../assets/connect/pin-t3b1.png'),
    [DeviceModelInternal.T3B1]: require('../assets/connect/pin-t3b1.png'),
    [DeviceModelInternal.T3T1]: require('../assets/connect/pin-t3t1.png'),
    [DeviceModelInternal.T3W1]: require('../assets/connect/pin-t3w1.png'),
};
