import { stakingProductLimitsSchema } from '@suite-common/earn-staking-common';

import { getMaxStakeAmount } from './getMaxStakeAmount';

const limits = stakingProductLimitsSchema.parse({
    minStakeAmount: '10',
    maxStakeAmount: '1000',
    minWithdrawalAmount: '20',
    feeBufferBalance: '5',
    minBalanceForStaking: '102',
    minStakeAmountForDashboard: '10',
});

describe('getMaxStakeAmount', () => {
    it.each([
        { name: 'nothing from an empty balance', balance: '0', expected: '0' },
        { name: 'nothing from a balance below the fee buffer', balance: '3', expected: '0' },
        { name: 'all but the fee buffer from a small balance', balance: '50', expected: '45' },
        {
            name: 'all but the fee buffer up to the minimum staking balance',
            balance: '107',
            expected: '102',
        },
        {
            name: 'all but the withdrawal reserve above the minimum staking balance',
            balance: '108',
            expected: '88',
        },
        { name: 'no more than the product maximum', balance: '5000', expected: '1000' },
    ])('stakes $name', ({ balance, expected }) => {
        expect(getMaxStakeAmount(balance, limits)).toBe(expected);
    });
});
