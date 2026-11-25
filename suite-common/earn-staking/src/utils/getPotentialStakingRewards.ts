import {
    type StakingAmount,
    type StakingProductLimits,
    ZERO_STAKING_AMOUNT,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { getStakeableBalance } from './getStakeableBalance';

export type PotentialStakingRewardsAccount = {
    availableBalance: string;
};

export type GetPotentialStakingRewardsParams = {
    accounts: readonly PotentialStakingRewardsAccount[];
    limits: StakingProductLimits | null;
    rate: number | null;
};

// A year at the product rate on what each account, which is not staking yet, could put at stake:
// its available balance less the registration deposit. An account below the minimum earns nothing.
export const getPotentialStakingRewards = ({
    accounts,
    limits,
    rate,
}: GetPotentialStakingRewardsParams): StakingAmount => {
    if (rate === null || limits === null) {
        return ZERO_STAKING_AMOUNT;
    }

    const rewards = accounts.reduce((sum, { availableBalance }) => {
        if (new BigNumber(availableBalance).lt(limits.minStakeAmount)) {
            return sum;
        }

        const stakeable = new BigNumber(getStakeableBalance({ availableBalance, limits }));

        return sum.plus(stakeable.times(rate).div(100));
    }, new BigNumber(0));

    return stakingAmountSchema.parse(rewards.integerValue(BigNumber.ROUND_DOWN).toFixed(0));
};
