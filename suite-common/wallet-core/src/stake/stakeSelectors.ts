import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    BACKUP_APY,
    BACKUP_CARDANO_APY,
    BACKUP_ETH_APY,
    BACKUP_SOL_APY,
    CARDANO_APY_MIN_THRESHOLD,
} from '@suite-common/wallet-constants';
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
        return BACKUP_APY;
    }

    if (isSupportedSolStakingNetworkSymbol(symbol)) {
        return data?.[symbol]?.stakingInfo?.data?.apy || BACKUP_SOL_APY;
    }

    if (isSupportedAdaStakingNetworkSymbol(symbol)) {
        if (!misc || !('staking' in misc)) return BACKUP_CARDANO_APY;

        const stakingInfo = data?.[symbol]?.stakingInfo?.data;
        const stakingPoolId = misc.staking?.poolId;

        if (!stakingInfo?.pools) return BACKUP_CARDANO_APY;

        // if the user is not staked yet pick the best pool
        const poolId = stakingPoolId || selectBestCardanoPool(stakingInfo?.pools)?.bech32;

        const selectedPool = stakingInfo?.pools?.find(pool => pool.id === poolId);
        if (!selectedPool) return BACKUP_CARDANO_APY;

        const { apy } = selectedPool;

        // fallback if APY missing, zero, or below threshold
        if (!apy || apy < CARDANO_APY_MIN_THRESHOLD) {
            return BACKUP_CARDANO_APY;
        }

        return apy;
    }

    return data?.[symbol]?.poolStats?.data.ethApy || BACKUP_ETH_APY;
};

export const selectCardanoPoolsInfo = (state: StakeRootState) =>
    state.wallet.stake?.data?.ada?.stakingInfo?.data?.pools ?? [];

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

export const selectVotingDelegationOption = (state: StakeRootState): VotingDelegationOption =>
    state.wallet.stake.votingDelegation;
