import type { UnknownDevice } from '@suite-common/suite-types';
import { mockConnectDevice } from '@suite-common/suite-types/mocks';

import { getIsDeviceIdValid } from './getIsDeviceIdValid';

describe(getIsDeviceIdValid.name, () => {
    it('returns true valid acquired device', () => {
        const device = mockConnectDevice({ id: 'valid-id' });
        expect(getIsDeviceIdValid(device)).toBe(true);
    });

    it('returns false for acquired device with empty id', () => {
        const device = mockConnectDevice({ id: '' });
        const device2 = mockConnectDevice({ id: undefined });
        expect(getIsDeviceIdValid(device)).toBe(false);
        expect(getIsDeviceIdValid(device2)).toBe(false);
    });

    it('returns true for unacquired device', () => {
        const device = { type: 'unacquired', id: undefined, features: undefined } as UnknownDevice;
        expect(getIsDeviceIdValid(device)).toBe(true);
    });

    it('returns true for bootloader device', () => {
        const device = mockConnectDevice({ id: undefined }, { bootloader_mode: true });
        expect(getIsDeviceIdValid(device)).toBe(true);
    });

    it('returns true when device is undefined', () => {
        expect(getIsDeviceIdValid(undefined)).toBe(true);
    });
});
