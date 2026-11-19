import { formatStakingAmount, getPotentialStakingRewards } from '@suite-common/earn-staking';
import { type StakingProductLimits } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

export type GetEarnStakingPotentialRewardsParams = {
    /** What the stake earns in a year, in the network's main unit. */
    currentRewards: string;
    availableBalance: string;
    limits: StakingProductLimits | null;
    rate: number | null;
    networkSymbol: NetworkSymbol;
};

// The row's "if you add" estimate: what the stake earns now plus what the available balance
// would add once staked, so a staked account reads a total and not only the increment.
export const getEarnStakingPotentialRewards = ({
    currentRewards,
    availableBalance,
    limits,
    rate,
    networkSymbol,
}: GetEarnStakingPotentialRewardsParams): string => {
    const availableBalanceRewards = formatStakingAmount({
        amount: getPotentialStakingRewards({ accounts: [{ availableBalance }], limits, rate }),
        networkSymbol,
    });

    return new BigNumber(currentRewards).plus(availableBalanceRewards).toFixed();
};
