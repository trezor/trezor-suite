import { DeviceModelInternal } from '@trezor/connect';

import { isDeviceWithButtons } from '../device';

describe('device utils', () => {
    test('isDeviceWithButtons', () => {
        expect(isDeviceWithButtons(DeviceModelInternal.T3B1)).toBe(true);
        expect(isDeviceWithButtons(DeviceModelInternal.T3T1)).toBe(false);
    });
});
