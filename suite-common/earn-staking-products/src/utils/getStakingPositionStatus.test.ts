import type { StakingPositionBalances } from '@suite-common/earn-staking-common';

import { getStakingPositionStatus } from './getStakingPositionStatus';
import { ZERO_STAKING_AMOUNT, toStakingAmount } from './stakingAmounts';

const getBalances = (balances: Partial<StakingPositionBalances>): StakingPositionBalances => ({
    staked: ZERO_STAKING_AMOUNT,
    pending: ZERO_STAKING_AMOUNT,
    unstaking: ZERO_STAKING_AMOUNT,
    withdrawable: ZERO_STAKING_AMOUNT,
    rewards: ZERO_STAKING_AMOUNT,
    ...balances,
});

const AMOUNT = toStakingAmount('1000');

describe('getStakingPositionStatus', () => {
    it.each([
        {
            name: 'anything is staked, whatever else is moving',
            balances: getBalances({ staked: AMOUNT, pending: AMOUNT, unstaking: AMOUNT }),
            expected: 'active',
        },
        {
            name: 'only a deposit is pending',
            balances: getBalances({ pending: AMOUNT, unstaking: AMOUNT }),
            expected: 'activating',
        },
        {
            name: 'only a withdrawal is in flight',
            balances: getBalances({ unstaking: AMOUNT }),
            expected: 'deactivating',
        },
        {
            name: 'only a withdrawable amount is left',
            balances: getBalances({ withdrawable: AMOUNT }),
            expected: 'deactivating',
        },
        {
            name: 'only rewards are left',
            balances: getBalances({ rewards: AMOUNT }),
            expected: 'inactive',
        },
        { name: 'every balance is zero', balances: getBalances({}), expected: 'inactive' },
    ])('is $expected when $name', ({ balances, expected }) => {
        expect(getStakingPositionStatus({ balances })).toBe(expected);
    });
});
