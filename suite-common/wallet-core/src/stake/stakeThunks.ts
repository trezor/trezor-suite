import { getStakingBatch } from '@suite-common/earn-staking-api';
import { createThunk } from '@suite-common/redux-utils';
import { PROD_STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { type TimerId } from '@trezor/type-utils';

import { stakeDataActions } from './stakeDataSlice';
import { type StakeRootState } from './stakeReducerTypes';
import { selectStake } from './stakeSelectors';
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
        const isBtcOnly = enabledNetworks.length === 1 && enabledNetworks.includes('btc');

        if (isBtcOnly) return;

        // because fetch only happens every 5 minutes we fetch according all devices in case a device is changed within those 5 minutes
        const needsRefetch = stakingDataNeedsRefetch(selectStake(getState()).data);

        if (!needsRefetch) return;

        try {
            // If we use thunk actions, there'll cir. deps
            dispatch(stakeDataActions.fetchStakeDataRequest(undefined));

            const stakingData = await getStakingBatch({
                params: { networks: PROD_STAKING_SYMBOLS },
            });

            // A part of the batch requests failed.
            if (stakingData.errors.length) {
                const failedNetworkSymbols = PROD_STAKING_SYMBOLS.filter(
                    symbol => !stakingData.data.some(item => item.symbol === symbol),
                );
                const errorSummary = stakingData.errors
                    .map(({ code, message }) => `${code}: ${message}`)
                    .join('; ');

                // Deliberately console.warn, not console.error: captureConsoleIntegration turns
                // error-level logs into Sentry events on all platforms (objects render there as
                // "[object Object]"), and these partial upstream failures are user-unactionable
                // and already reported with full fidelity by the earn-staking worker itself.
                console.warn(
                    `Staking batch upstream error (${failedNetworkSymbols.join(', ')}): ${errorSummary}`,
                );
            }

            dispatch(stakeDataActions.fetchStakeDataSuccess(stakingData.data));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';

            // Also console.warn: a whole-batch failure is transient network noise (client
            // offline, worker outage) and this thunk retries every 60 seconds, so an
            // error-level log would flood Sentry for the outage duration.
            console.warn(`Staking batch request failed: ${message}`);
            dispatch(stakeDataActions.fetchStakeDataFailure(message));
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
