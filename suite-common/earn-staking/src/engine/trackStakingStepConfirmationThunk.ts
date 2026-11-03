import {
    type FeesRootState,
    type FetchAndUpdateAccountThunkDeps,
    type FetchAndUpdateAccountThunkState,
    fetchAndUpdateAccountThunk,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { getPollIntervalMs } from '@suite-common/wallet-utils';
import { createThunk } from '@trezor/redux-utils';
import { resolveAfter } from '@trezor/utils';

import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import { getStakingStepSettlement, getStakingStepSettlementAction } from './stakingConfirmation';
import type { StakingRootState } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import { selectStakingSession } from '../state/stakingSessionSelectors';
import { syncStakingPositionsThunk } from '../state/stakingThunks';

export const STAKING_CONFIRMATION_TRACKING_TIMEOUT_MS = 15 * 60 * 1000;

type TrackStakingStepConfirmationParams = {
    sessionKey: StakingSessionKey;
    stepId: string;
};

export type TrackStakingStepConfirmationThunkState = StakingRootState &
    FeesRootState &
    FetchAndUpdateAccountThunkState;

export type TrackStakingStepConfirmationThunkDeps = FetchAndUpdateAccountThunkDeps;

export const trackStakingStepConfirmationThunk = createThunk<
    void,
    TrackStakingStepConfirmationParams,
    {
        state: TrackStakingStepConfirmationThunkState;
        extra: TrackStakingStepConfirmationThunkDeps;
    }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/trackStakingStepConfirmation`,
    async ({ sessionKey, stepId }, { dispatch, getState }) => {
        const deadline = Date.now() + STAKING_CONFIRMATION_TRACKING_TIMEOUT_MS;

        const getAwaitingStep = () => {
            const session = selectStakingSession(getState(), sessionKey);
            const step = session?.steps.find(candidate => candidate.id === stepId);

            return session !== null && step?.status === 'awaiting'
                ? { accountKey: session.accountKey, txid: step.txid }
                : null;
        };

        while (Date.now() < deadline) {
            const awaiting = getAwaitingStep();

            if (awaiting === null) return;

            const settlement = getStakingStepSettlement(
                { sessionKey, stepId, txid: awaiting.txid },
                selectTransactionByAccountKeyAndTxid(
                    getState(),
                    awaiting.accountKey,
                    awaiting.txid,
                ),
            );

            if (settlement !== null) {
                dispatch(getStakingStepSettlementAction(settlement));
                dispatch(syncStakingPositionsThunk({ accountKey: awaiting.accountKey }));

                return;
            }

            await dispatch(fetchAndUpdateAccountThunk({ accountKey: awaiting.accountKey }));

            if (getAwaitingStep() === null) return;

            const account = selectAccountByKey(getState(), awaiting.accountKey);

            await resolveAfter(
                getPollIntervalMs(
                    selectConvertedNetworkFeeInfo(getState(), account?.symbol)?.blockTime,
                ),
            );
        }
    },
);
