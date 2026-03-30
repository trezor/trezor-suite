import { type NetworkSymbol, isProdStakingNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { selectBestCardanoPool } from '@suite-common/wallet-utils';

import type { VotingDelegationOption } from './stakeActions';
import type { StakeRootState } from './stakeReducerTypes';

export const selectStake = (state: StakeRootState) => state.wallet.stake;

export const selectStakeData = (state: StakeRootState) => selectStake(state).data;

export const selectCardanoPoolsInfo = (state: StakeRootState) =>
    selectStakeData(state).data.ada?.pools ?? [];

export const selectEthNextRewardPayout = (state: StakeRootState) =>
    selectStakeData(state).data.eth?.stats?.nextRewardPayout;

export const selectEthValidatorsQueue = (state: StakeRootState) =>
    selectStakeData(state).data.eth?.validators;

interface SelectPoolStatsApyProps {
    account?: Account;
    networkSymbol?: NetworkSymbol;
}

export const selectPoolStatsApy = (
    state: StakeRootState,
    { account, networkSymbol = account?.symbol }: SelectPoolStatsApyProps,
) => {
    const { data } = selectStakeData(state);

    if (!networkSymbol || !account || !isProdStakingNetworkSymbol(networkSymbol)) {
        return null;
    }

    switch (networkSymbol) {
        case 'eth':
            return data.eth?.stats?.apy ?? null;

        case 'sol':
            return data.sol?.apy ?? null;

        case 'ada': {
            const { misc } = account;
            const stakingPoolId = misc && 'staking' in misc ? misc.staking.poolId : undefined;
            const poolFromAccount = data.ada?.pools?.find(pool => pool.id === stakingPoolId);

            const poolStats = data.ada?.pools ?? [];
            const bestPoolId = selectBestCardanoPool(poolStats).bech32;

            const poolFromBest =
                bestPoolId && !poolFromAccount
                    ? poolStats.find(pool => pool.id === bestPoolId)
                    : undefined;

            const selectedPool = poolFromAccount ?? poolFromBest;

            return selectedPool?.apy ?? null;
        }

        default:
            return null;
    }
};

export const selectVotingDelegationOption = (state: StakeRootState): VotingDelegationOption =>
    state.wallet.stake.votingDelegation;

export const selectStakePrecomposedForm = (state: StakeRootState) =>
    state.wallet.stake.precomposedForm;
