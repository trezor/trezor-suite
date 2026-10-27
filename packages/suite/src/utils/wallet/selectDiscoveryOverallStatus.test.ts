import { type AppState } from 'src/types/suite';

import { selectDiscoveryOverallStatus } from './selectDiscoveryOverallStatus';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

describe('selectDiscoveryOverallStatus', () => {
    it('waits for a device when none is selected', () => {
        expect(selectDiscoveryOverallStatus(mockInitialAppState)).toEqual({
            status: 'loading',
            type: 'waiting-for-device',
        });
    });

    it('returns the same reference while its inputs do not change', () => {
        const first = selectDiscoveryOverallStatus(mockInitialAppState);
        const unrelatedChange: AppState = {
            ...mockInitialAppState,
            flags: { ...mockInitialAppState.flags },
        };

        expect(selectDiscoveryOverallStatus(mockInitialAppState)).toBe(first);
        expect(selectDiscoveryOverallStatus(unrelatedChange)).toBe(first);
    });
});
