import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';

import { isBalanceBelowStakingMinimum } from './isBalanceBelowStakingMinimum';

// 0.1 ETH minimum stake and a 0.01 ETH fee buffer.
const { limits } = mockStakingProductDescriptor();

describe('isBalanceBelowStakingMinimum', () => {
    it.each([
        { name: 'below the minimum', availableBalance: '10000000000000000', expected: true },
        {
            name: 'just below the threshold',
            availableBalance: '109999999999999999',
            expected: true,
        },
        { name: 'equal to the threshold', availableBalance: '110000000000000000', expected: false },
        { name: 'above the threshold', availableBalance: '200000000000000000', expected: false },
    ])('is $expected for a balance $name', ({ availableBalance, expected }) => {
        expect(isBalanceBelowStakingMinimum({ availableBalance, limits })).toBe(expected);
    });

    it('is false without a product to stake into', () => {
        expect(isBalanceBelowStakingMinimum({ availableBalance: '0', limits: null })).toBe(false);
    });
});
