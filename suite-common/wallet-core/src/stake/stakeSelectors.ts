import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_APY_MIN_THRESHOLD } from '@suite-common/wallet-constants';
import { Account } from '@suite-common/wallet-types';
import {
    isSupportedAdaStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    selectBestCardanoPool,
} from '@suite-common/wallet-utils';

import { VotingDelegationOption } from './stakeActions';
import { StakeRootState } from './stakeReducer';

export const selectEverstakeData = (
    state: StakeRootState,
    symbol: NetworkSymbol,
    endpointType: 'poolStats' | 'validatorsQueue' | 'stakingInfo',
) => state.wallet.stake?.data?.[symbol]?.[endpointType];

export const selectPoolStatsApyData = (
    state: StakeRootState,
    account?: Account,
    networkSymbol?: NetworkSymbol,
) => {
    const { data } = state.wallet.stake ?? {};
    const { symbol: symbolFromAccount, misc } = account ?? {};

    const symbol = symbolFromAccount ?? networkSymbol;

    if (!symbol || !data) {
        return null;
    }

    const stakingInfoData = data?.[symbol]?.stakingInfo?.data;

    if (stakingInfoData && isSupportedSolStakingNetworkSymbol(symbol)) {
        return 'apy' in stakingInfoData ? stakingInfoData.apy : null;
    }

    if (isSupportedAdaStakingNetworkSymbol(symbol)) {
        const stakingInfo = data?.[symbol]?.stakingInfo?.data ?? null;

        if (
            !stakingInfo ||
            !('pools' in stakingInfo) ||
            !stakingInfo.pools ||
            stakingInfo.pools.length === 0
        ) {
            return null;
        }

        const stakingPoolId = misc && 'staking' in misc ? misc.staking.poolId : undefined;

        const poolFromAccount = stakingPoolId
            ? stakingInfo.pools.find(pool => pool.id === stakingPoolId)
            : undefined;

        const bestPoolId = selectBestCardanoPool(stakingInfo.pools)?.bech32;
        const poolFromBest =
            bestPoolId && !poolFromAccount
                ? stakingInfo.pools.find(pool => pool.id === bestPoolId)
                : undefined;

        const selectedPool = poolFromAccount ?? poolFromBest;

        if (!selectedPool) {
            return null;
        }

        const { apy } = selectedPool;

        if (!apy || apy < CARDANO_APY_MIN_THRESHOLD) {
            return null;
        }

        return apy;
    }

    return data[symbol]?.poolStats?.data?.ethApy || null;
};

export const selectCardanoPoolsInfo = (state: StakeRootState) => {
    const data = state.wallet.stake?.data?.ada?.stakingInfo?.data;

    return data && 'pools' in data ? data.pools : [];
};

export const selectPoolStatsNextRewardPayout = (state: StakeRootState, symbol?: NetworkSymbol) => {
    if (!symbol) {
        return undefined;
    }

    return state.wallet.stake?.data?.[symbol]?.poolStats?.data?.nextRewardPayout;
};

export const selectValidatorsQueueData = (state: StakeRootState, symbol?: NetworkSymbol) => {
    if (!symbol) {
        return null;
    }

    return state.wallet.stake?.data?.[symbol]?.validatorsQueue?.data || null;
};

export const selectValidatorsQueue = (state: StakeRootState, symbol?: NetworkSymbol) => {
    if (!symbol) {
        return null;
    }

    return state.wallet.stake?.data?.[symbol]?.validatorsQueue ?? null;
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

export const selectVotingDelegationOption = (state: StakeRootState): VotingDelegationOption =>
    state.wallet.stake.votingDelegation;
