import { type Discovery, type DiscoveryStatus } from '@suite-common/wallet-types';

import { type DiscoveryRootState } from './discoveryReducer';
import { selectHasAnyRunningDiscovery } from './discoverySelectors';

const getState = (...statuses: DiscoveryStatus['status'][]): DiscoveryRootState => ({
    wallet: {
        discovery: Object.fromEntries(
            statuses.map((status, index) => [`device-${index}`, { status }]),
        ) as Discovery,
    },
});

describe(selectHasAnyRunningDiscovery.name, () => {
    it('is false without any discovery', () => {
        expect(selectHasAnyRunningDiscovery(getState())).toBe(false);
    });

    it('is false when every discovery is finished', () => {
        expect(selectHasAnyRunningDiscovery(getState('complete', 'failed', 'cancelled'))).toBe(
            false,
        );
    });

    it('is true when a discovery of any device is in progress', () => {
        expect(selectHasAnyRunningDiscovery(getState('complete', 'progress'))).toBe(true);
    });
});
