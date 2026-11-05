import type { StakingAmount } from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { ZERO_STAKING_AMOUNT, toStakingAmount } from '../../utils/stakingAmounts';

// The legacy SOLANA_EPOCH_DAYS: delegating and deactivating both take one epoch, counted as one day.
export const SOLANA_EPOCH_DAYS = 1;

const DAYS_IN_YEAR = 365;

export type GetSolanaExpectedEpochRewardParams = {
    yieldBearingStake: StakingAmount;
    rate: number | null;
};

// The legacy calculateSolanaStakingReward in lamports: the dashboards show the reward
// expected for the current epoch, since real rewards compound into the stake accounts.
export const getSolanaExpectedEpochReward = ({
    yieldBearingStake,
    rate,
}: GetSolanaExpectedEpochRewardParams): StakingAmount => {
    if (rate === null) return ZERO_STAKING_AMOUNT;

    return toStakingAmount(
        new BigNumber(yieldBearingStake)
            .multipliedBy(rate)
            .dividedBy(100)
            .dividedBy(DAYS_IN_YEAR)
            .multipliedBy(SOLANA_EPOCH_DAYS),
    );
};
