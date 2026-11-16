import {
    type StakingAmount,
    type StakingProductLimits,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

const ZERO_STAKING_AMOUNT = stakingAmountSchema.parse('0');

export type PotentialStakingRewardsAccount = {
    availableBalance: string;
    principal: StakingAmount;
};

export type GetPotentialStakingRewardsParams = {
    accounts: readonly PotentialStakingRewardsAccount[];
    limits: StakingProductLimits;
    rate: number | null;
};

// A year at the product rate on what each account could have at stake: its principal and its
// available balance, less the registration deposit. An account below the minimum stake earns nothing.
export const getPotentialStakingRewards = ({
    accounts,
    limits,
    rate,
}: GetPotentialStakingRewardsParams): StakingAmount => {
    if (rate === null) {
        return ZERO_STAKING_AMOUNT;
    }

    const rewards = accounts.reduce((sum, { availableBalance, principal }) => {
        if (new BigNumber(availableBalance).lt(limits.minStakeAmount)) {
            return sum;
        }

        const stakeable = BigNumber.max(
            new BigNumber(principal).plus(availableBalance).minus(limits.registrationDeposit),
            0,
        );

        return sum.plus(stakeable.times(rate).div(100));
    }, new BigNumber(0));

    return stakingAmountSchema.parse(rewards.integerValue(BigNumber.ROUND_DOWN).toFixed(0));
};
