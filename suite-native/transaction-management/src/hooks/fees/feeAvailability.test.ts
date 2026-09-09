import { type FeeInfo } from '@suite-common/wallet-types';

import { isNetworkFeeUnavailable } from './feeAvailability';

const feeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: 0,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1', blocks: 1 }],
};

describe(isNetworkFeeUnavailable.name, () => {
    it('reports unavailable fees after fetching fails without any fee data', () => {
        expect(isNetworkFeeUnavailable({ feeInfo: undefined, feeStatus: 'error' })).toBe(true);
    });

    it('keeps cached fee data available after a refresh fails', () => {
        expect(isNetworkFeeUnavailable({ feeInfo, feeStatus: 'error' })).toBe(false);
    });

    it('does not report unavailable fees while fetching is in progress', () => {
        expect(isNetworkFeeUnavailable({ feeInfo: undefined, feeStatus: 'loading' })).toBe(false);
    });
});
