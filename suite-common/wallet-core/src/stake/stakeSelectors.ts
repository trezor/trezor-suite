import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    getCardanoAccountPoolId,
    secondsToDays,
    selectBestCardanoPool,
} from '@suite-common/wallet-utils';

import type { VotingDelegationOption } from './stakeActions';
import type { StakeRootState } from './stakeReducerTypes';

export const selectStake = (state: StakeRootState) => state.wallet.stake;

export const selectStakeData = (state: StakeRootState) => selectStake(state).data.data;

export const selectCardanoPoolsInfo = (state: StakeRootState) =>
    returnStableArrayIfEmpty(selectStakeData(state).ada?.pools);

export const selectEthNextRewardPayout = (state: StakeRootState) => {
    const nextRewardPayout = selectStakeData(state).eth?.stats?.nextRewardPayout;

    return nextRewardPayout ? Math.max(1, secondsToDays(nextRewardPayout)) : null;
};

export const selectEthValidatorsQueue = (state: StakeRootState) =>
    selectStakeData(state).eth?.validators;

interface SelectPoolStatsApyProps {
    account?: Account;
    networkSymbol?: NetworkSymbol;
}

export const selectPoolStatsApy = (
    state: StakeRootState,
    { account, networkSymbol }: SelectPoolStatsApyProps,
) => {
    const data = selectStakeData(state);
    const symbol = account?.symbol ?? networkSymbol;

    if (!symbol || !data) {
        return null;
    }

    switch (symbol) {
        case 'eth':
            return data.eth?.stats?.apy ?? null;

        case 'sol':
            return data.sol?.stats?.apy ?? null;

        case 'ada': {
            const poolStats = data.ada?.pools ?? [];
            const accountPoolId = getCardanoAccountPoolId(account);

            if (accountPoolId) {
                // The account's own APY, or null when staked outside Everstake (no pool stats).
                // For the promoted APY, query by networkSymbol instead.
                const poolFromAccount = poolStats.find(pool => pool.id === accountPoolId);

                return poolFromAccount?.apy ?? null;
            }

            // No active delegation (not staking yet, or queried by network) → promote best pool.
            const bestPoolId = selectBestCardanoPool(poolStats).bech32;
            const bestPool = bestPoolId
                ? poolStats.find(pool => pool.id === bestPoolId)
                : undefined;

            return bestPool?.apy ?? null;
        }

        default:
            return null;
    }
};

export const selectVotingDelegationOption = (state: StakeRootState): VotingDelegationOption =>
    selectStake(state).votingDelegation;

export const selectStakePrecomposedForm = (state: StakeRootState) =>
    selectStake(state).precomposedForm;

export const selectStakePrecomposedTx = (state: StakeRootState) => selectStake(state).precomposedTx;
