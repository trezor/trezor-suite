import { formatStakingAmount, selectStakingAccountTotals } from '@suite-common/earn-staking';
import { useSolanaRewardsTotal } from '@suite-common/earn-staking-api/src/staking';
import { getNetworkType } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

export type StakingTotalRewards = {
    totalRewards: string;
    isTotalRewardsLoading: boolean;
};

// Only Solana mainnet has its lifetime rewards on the Earn API; every other position reports
// the rewards it holds.
export const useStakingTotalRewards = (account: Account): StakingTotalRewards => {
    const totals = useSelector(state => selectStakingAccountTotals(state, account.key));
    const solanaRewardsTotalQuery = useSolanaRewardsTotal(account);

    if (account.symbol === 'sol') {
        const totalRewards = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(solanaRewardsTotalQuery.data ?? '0')),
            symbol: account.symbol,
        }).toString();

        const isTotalRewardsLoading = solanaRewardsTotalQuery.isLoading;

        return { totalRewards, isTotalRewardsLoading };
    }

    // A Solana position's rewards estimate the next epoch, which is no total: a Solana network
    // the rewards API does not serve shows none.
    if (getNetworkType(account.symbol) === 'solana') {
        return { totalRewards: '0', isTotalRewardsLoading: false };
    }

    const totalRewards = formatStakingAmount({
        amount: totals.rewards,
        networkSymbol: account.symbol,
    });

    return { totalRewards, isTotalRewardsLoading: false };
};
