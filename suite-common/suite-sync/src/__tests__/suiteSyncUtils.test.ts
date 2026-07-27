import { portfolioTrackerDevice } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { type SuiteSyncInteraction } from '../suiteSyncTypes';
import {
    getIsSuiteSyncLabelingActionEnabled,
    isSuiteSyncSupportedByDevice,
} from '../suiteSyncUtils';

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

describe(getIsSuiteSyncLabelingActionEnabled.name, () => {
    it.each<[SuiteSyncInteraction | null, boolean, string]>([
        [null, true, 'null enables labeling action'],
        ['suite-sync-off', true, 'suite-sync-off enables labeling action'],
        ['keys-needed', true, 'keys-needed enables labeling action'],
        ['unsupported', false, 'unsupported disables labeling action'],
        ['firmware-upgrade-needed', true, 'firmware-upgrade-needed enables labeling action'],
    ])('when interaction is %s should return %s', (suiteSyncInteraction, expected) => {
        expect(getIsSuiteSyncLabelingActionEnabled(suiteSyncInteraction)).toBe(expected);
    });
});
