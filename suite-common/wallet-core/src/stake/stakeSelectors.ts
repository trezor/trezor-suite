import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BACKUP_APY, BACKUP_ETH_APY, BACKUP_SOL_APY } from '@suite-common/wallet-constants';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';

import { StakeRootState } from './stakeReducer';

export const selectEverstakeData = (
    state: StakeRootState,
    symbol: NetworkSymbol,
    endpointType: 'poolStats' | 'validatorsQueue' | 'getAssets',
) => state.wallet.stake?.data?.[symbol]?.[endpointType];

export const selectPoolStatsApyData = (state: StakeRootState, symbol?: NetworkSymbol) => {
    const { data } = state.wallet.stake ?? {};

    if (!symbol || !data) {
        return BACKUP_APY;
    }

    if (isSupportedSolStakingNetworkSymbol(symbol)) {
        return data?.[symbol]?.getAssets?.data?.apy || BACKUP_SOL_APY;
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
