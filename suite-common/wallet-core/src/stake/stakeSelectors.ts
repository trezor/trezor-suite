import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    BACKUP_APY,
    BACKUP_CARDANO_APY,
    BACKUP_ETH_APY,
    BACKUP_SOL_APY,
} from '@suite-common/wallet-constants';
import {
    isSupportedCardanoStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';

import { StakeRootState } from './stakeReducer';

export const selectEverstakeData = (
    state: StakeRootState,
    symbol: NetworkSymbol,
    endpointType: 'poolStats' | 'validatorsQueue' | 'stakingInfo',
) => state.wallet.stake?.data?.[symbol]?.[endpointType];

export const selectPoolStatsApyData = (state: StakeRootState, symbol?: NetworkSymbol) => {
    const { data } = state.wallet.stake ?? {};

    if (!symbol || !data) {
        return BACKUP_APY;
    }

    if (isSupportedSolStakingNetworkSymbol(symbol)) {
        return data?.[symbol]?.stakingInfo?.data?.apy || BACKUP_SOL_APY;
    }

    if (isSupportedCardanoStakingNetworkSymbol(symbol)) {
        return BACKUP_CARDANO_APY;
    }

    return data?.[symbol]?.poolStats?.data.ethApy || BACKUP_ETH_APY;
};

export const selectPoolStatsNextRewardPayout = (state: StakeRootState, symbol?: NetworkSymbol) => {
    if (!symbol) {
        return undefined;
    }

    return state.wallet.stake?.data?.[symbol]?.poolStats?.data?.nextRewardPayout;
};

export const selectValidatorsQueueData = (state: StakeRootState, symbol?: NetworkSymbol) => {
    if (!symbol) {
        return {};
    }

    return state.wallet.stake?.data?.[symbol]?.validatorsQueue?.data || {};
};

export const selectValidatorsQueue = (state: StakeRootState, symbol?: NetworkSymbol) => {
    if (!symbol) {
        return undefined;
    }

    return state.wallet.stake?.data?.[symbol]?.validatorsQueue;
};

export const selectStakingRewardsHistory = (
    state: StakeRootState,
    symbol?: NetworkSymbol,
    descriptor?: string,
) => {
    const { data } = state.wallet.stake ?? {};

    if (!data || !symbol || !descriptor) {
        return undefined;
    }

    const stakingRewards = data?.[symbol]?.stakingRewards;
    const rewardsHistory = stakingRewards?.data?.rewardsHistory?.[descriptor];

    return { ...stakingRewards, ...{ data: rewardsHistory } };
};

export const selectStakingTotalRewards = (
    state: StakeRootState,
    symbol?: NetworkSymbol,
    descriptor?: string,
) => {
    const { data } = state.wallet.stake ?? {};

    if (!data || !symbol || !descriptor) {
        return undefined;
    }

    const stakingRewards = data?.[symbol]?.stakingRewards;
    const totalRewards = stakingRewards?.data?.totalRewards?.[descriptor];

    return { ...stakingRewards, ...{ data: totalRewards } };
};
