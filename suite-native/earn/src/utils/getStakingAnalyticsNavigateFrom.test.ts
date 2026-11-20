import { stakingAmountSchema } from '@suite-common/earn-staking-common';

import { getStakingAnalyticsNavigateFrom } from './getStakingAnalyticsNavigateFrom';

// 0.1 ETH.
const minStakeAmount = stakingAmountSchema.parse('100000000000000000');

describe('getStakingAnalyticsNavigateFrom', () => {
    it.each([
        {
            name: 'unknown without a product',
            isStakingActive: false,
            availableBalance: '1000000000000000000',
            minStakeAmount: null,
            expected: 'unknown',
        },
        {
            name: 'staking max with nothing left to stake',
            isStakingActive: true,
            availableBalance: '0',
            minStakeAmount,
            expected: 'dashboard/staking-dashboard/staking-max',
        },
        {
            name: 'staked with too little left for another stake',
            isStakingActive: true,
            availableBalance: '50000000000000000',
            minStakeAmount,
            expected: 'dashboard/staking-dashboard/staked-but-insufficient-funds',
        },
        {
            name: 'staked with enough left for another stake',
            isStakingActive: true,
            availableBalance: '100000000000000000',
            minStakeAmount,
            expected: 'dashboard/staking-dashboard/staking-active',
        },
        {
            name: 'not staked with enough to stake',
            isStakingActive: false,
            availableBalance: '100000000000000000',
            minStakeAmount,
            expected: 'dashboard/staking-dashboard/staking-inactive',
        },
        {
            name: 'not staked with too little to stake',
            isStakingActive: false,
            availableBalance: '1',
            minStakeAmount,
            expected: 'dashboard/staking-dashboard/insufficient-funds',
        },
    ])('is $expected when $name', ({ name: _name, expected, ...params }) => {
        expect(getStakingAnalyticsNavigateFrom(params)).toBe(expected);
    });
});
