import { type StakingAmount } from '@suite-common/earn-staking-common';
import { type StakingNavigateFrom } from '@suite-native/analytics';
import { BigNumber } from '@trezor/utils';

type GetStakingAnalyticsNavigateFromParams = {
    isStakingActive: boolean;
    availableBalance: string;
    minStakeAmount: StakingAmount | null;
};

export const getStakingAnalyticsNavigateFrom = ({
    isStakingActive,
    availableBalance,
    minStakeAmount,
}: GetStakingAnalyticsNavigateFromParams): StakingNavigateFrom => {
    if (minStakeAmount === null) return 'unknown';

    const available = new BigNumber(availableBalance);
    const hasEnoughBalanceForStaking = available.gte(minStakeAmount);

    if (isStakingActive) {
        if (available.isZero()) {
            return 'dashboard/staking-dashboard/staking-max';
        }

        if (!hasEnoughBalanceForStaking) {
            return 'dashboard/staking-dashboard/staked-but-insufficient-funds';
        }

        return 'dashboard/staking-dashboard/staking-active';
    }

    return hasEnoughBalanceForStaking
        ? 'dashboard/staking-dashboard/staking-inactive'
        : 'dashboard/staking-dashboard/insufficient-funds';
};
