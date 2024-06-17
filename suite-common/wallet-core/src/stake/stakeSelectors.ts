import { NetworkSymbol } from '@suite-common/wallet-config';

import { BACKUP_ETH_APY } from './stakeTypes';
import { StakeRootState } from './stakeReducer';

export const selectEverstakeData = (
    state: StakeRootState,
    networkSymbol: NetworkSymbol,
    endpointType: 'poolStats' | 'validatorsQueue',
) => state.wallet.stake?.data?.[networkSymbol]?.[endpointType];

export const selectPoolStatsApyData = (state: StakeRootState, networkSymbol?: NetworkSymbol) => {
    if (!networkSymbol) {
        return BACKUP_ETH_APY;
    }

    return state.wallet.stake?.data?.[networkSymbol]?.poolStats.data.ethApy || BACKUP_ETH_APY;
};

export const selectPoolStatsNextRewardPayout = (
    state: StakeRootState,
    networkSymbol?: NetworkSymbol,
) => {
    if (!networkSymbol) {
        return undefined;
    }

    return state.wallet.stake?.data?.[networkSymbol]?.poolStats.data?.nextRewardPayout;
};

export const selectValidatorsQueueData = (state: StakeRootState, networkSymbol?: NetworkSymbol) => {
    if (!networkSymbol) {
        return {};
    }

    return state.wallet.stake?.data?.[networkSymbol]?.validatorsQueue.data || {};
};

export const selectValidatorsQueue = (state: StakeRootState, networkSymbol?: NetworkSymbol) => {
    if (!networkSymbol) {
        return undefined;
    }

    return state.wallet.stake?.data?.[networkSymbol]?.validatorsQueue;
};
