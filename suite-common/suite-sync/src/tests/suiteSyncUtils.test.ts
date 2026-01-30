import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { portfolioTrackerDevice } from '@suite-common/wallet-core';

import { isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

describe(isSuiteSyncSupportedByDevice.name, () => {
    it.each([
        [portfolioTrackerDevice, false, "portfolio tracker doesn't support evolu"],
        [
            mockSuiteDevice({ unavailableCapabilities: {} }),
            true,
            'trezor device with no unavailable capabilities',
        ],
        [
            mockSuiteDevice({ unavailableCapabilities: { evolu: 'no-capability' } }),
            false,
            'trezor device with evolu unavailable',
        ],
    ])('%s should return %s', (device, expected) => {
        expect(isSuiteSyncSupportedByDevice(device)).toBe(expected);
    });
});
