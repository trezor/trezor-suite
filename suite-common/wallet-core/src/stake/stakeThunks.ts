import { getStakingBatch } from '@suite-common/earn-staking-api';
import { createThunk } from '@suite-common/redux-utils';
import { isSupportedStakingNetworkSymbol, isTestnet } from '@suite-common/wallet-utils';
import { type TimerId } from '@trezor/type-utils';

import { stakeDataSlice } from './stakeDataSlice';
import { type StakeRootState } from './stakeReducerTypes';
import { selectEnabledNetworks } from '../settings/walletSettingsReducer';

const STAKE_MODULE = '@common/wallet-core/stake';

function stakingDataNeedsRefetch(data: StakeRootState['wallet']['stake']['data']) {
    if (!data) return true;

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const shouldRefetch =
        (Boolean(data.error) || !data.lastSuccessAt || data.lastSuccessAt <= fiveMinutesAgo) &&
        !data.isLoading;

    return shouldRefetch;
}

export const initStakeDataThunk = createThunk(
    `${STAKE_MODULE}/initStakeDataThunk`,
    async (_, { getState, dispatch }) => {
        const enabledNetworks = selectEnabledNetworks(getState());
        const enabledStakingNetworks = new Set(
            enabledNetworks.filter(
                symbol => isSupportedStakingNetworkSymbol(symbol) && !isTestnet(symbol),
            ),
        );

        if (enabledStakingNetworks.size === 0) return;

        // because fetch only happens every 5 minutes we fetch according all devices in case a device is changed within those 5 minutes
        const needsRefetch = stakingDataNeedsRefetch(getState());

        if (!needsRefetch) return;

        try {
            // If we use thunk actions, there'll cir. deps
            dispatch(stakeDataSlice.actions.fetchStakeDataRequest(undefined));

            const stakingData = await getStakingBatch({
                params: { networks: Array.from(enabledStakingNetworks) },
            });

            dispatch(stakeDataSlice.actions.fetchStakeDataSuccess(stakingData));
        } catch (error) {
            console.error(error);
            dispatch(
                stakeDataSlice.actions.fetchStakeDataFailure(
                    error instanceof Error ? error.message : 'Unknown error',
                ),
            );
        }
    },
);

let stakeDataTimeout: TimerId | null = null;

export const periodicCheckStakeDataThunk = createThunk(
    `${STAKE_MODULE}/periodicCheckStakeDataThunk`,
    (_, { dispatch }) => {
        if (stakeDataTimeout) {
            clearTimeout(stakeDataTimeout);
        }

        stakeDataTimeout = setTimeout(() => {
            dispatch(periodicCheckStakeDataThunk());
        }, 60_000);

        return dispatch(initStakeDataThunk());
    },
);
