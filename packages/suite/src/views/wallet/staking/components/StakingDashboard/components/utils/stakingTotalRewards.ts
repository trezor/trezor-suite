import { type SolanaRewardsTotalQueryResult } from '@suite-common/earn-staking-api/src/staking';
import { type GetNetworkConfigDep } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getStakingDataForNetwork,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const getStakingTotalRewards = (
    deps: GetNetworkConfigDep,
    account: Account,
    solanaRewardsTotalQuery: SolanaRewardsTotalQueryResult,
) => {
    const { restakedReward = '0' } = getStakingDataForNetwork(deps, account) ?? {};

    switch (account.networkType) {
        case 'ethereum':
            return {
                totalRewards: restakedReward,
                isTotalRewardsLoading: false,
            };
        case 'solana': {
            const formattedTotal = subunitsToUnits({
                ...deps,
                value: asAmountSubunit(new BigNumber(solanaRewardsTotalQuery.data ?? '0')),
                symbol: account.symbol,
            });

            return {
                totalRewards: formattedTotal.toString(),
                isTotalRewardsLoading: solanaRewardsTotalQuery.isLoading,
            };
        }
        case 'cardano':
            return {
                totalRewards: restakedReward,
                isTotalRewardsLoading: false,
            };
        default:
            return {
                totalRewards: '0',
                isTotalRewardsLoading: false,
            };
    }
};
