import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { WATCH_ONLY_DEVICE_ID, portfolioTrackerDevice } from '../src/deviceConstants';
import { isVirtualDevice } from '../src/deviceUtils';

describe(isVirtualDevice.name, () => {
    it.each([
        ['portfolio tracker', portfolioTrackerDevice, true],
        ['watch-only account', mockSuiteDevice({ id: WATCH_ONLY_DEVICE_ID }), true],
        ['physical', mockSuiteDevice({ id: 'device-id' }), false],
        ['missing id', mockSuiteDevice({ id: null }), false],
        ['missing device', undefined, false],
    ] as const)('identifies a %s device', (_, device, expected) => {
        expect(isVirtualDevice(device)).toBe(expected);
    });
});
