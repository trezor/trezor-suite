import { selectSelectedDevice } from '@suite-common/device';
import {
    fetchAndUpdateAccountThunk,
    notifyEarnTransactionBroadcastThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import {
    type TrackStakingStepConfirmationThunkDeps,
    type TrackStakingStepConfirmationThunkState,
    trackStakingStepConfirmationThunk,
} from './trackStakingStepConfirmationThunk';
import type { StakingDep } from '../stakingServices';
import { callStakingAdapter, warnStakingAdapterFailure } from './callStakingAdapter';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import { getEarnTransactionFlow } from './getEarnTransactionFlow';
import type { StakingEngineRejection } from './stakingEngineRejection';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import { selectStakingStepContext } from '../state/stakingSessionSelectors';

type BroadcastStakingStepParams = {
    sessionKey: StakingSessionKey;
};

export type BroadcastStakingStepThunkState = StakingRootState &
    TrackStakingStepConfirmationThunkState;

export type BroadcastStakingStepThunkDeps = WithServices<StakingDep> &
    TrackStakingStepConfirmationThunkDeps;

export const broadcastStakingStepThunk = createThunk<
    { txid: string },
    BroadcastStakingStepParams,
    {
        state: BroadcastStakingStepThunkState;
        extra: BroadcastStakingStepThunkDeps;
        rejectValue: StakingEngineRejection;
    }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/broadcastStakingStep`,
    async ({ sessionKey }, { dispatch, getState, extra, rejectWithValue }) => {
        const stepContext = selectStakingStepContext(getState(), sessionKey);

        if (!stepContext.success) {
            return rejectWithValue(stepContext.rejection);
        }

        const { session, step, planStep, account } = stepContext.context;
        const adapter = extra.services.staking.stakingProductRepository.get(session.plan.productId);

        if (step.status !== 'signed') {
            return rejectWithValue('step-not-ready');
        }

        if (step.expiresAt !== null && step.expiresAt < Date.now()) {
            dispatch(
                stakingActions.stepReset({
                    sessionKey,
                    stepId: step.id,
                    error: { kind: 'expired', code: null },
                }),
            );

            return rejectWithValue('step-expired');
        }

        dispatch(stakingActions.stepBroadcasting({ sessionKey, stepId: step.id }));

        const flow = getEarnTransactionFlow(session.plan.operation);

        const broadcast = await callStakingAdapter(() =>
            adapter.broadcastStep({
                account,
                plan: session.plan,
                step: planStep,
                signedStep: step.signed,
            }),
        );

        if (!broadcast.success) {
            warnStakingAdapterFailure(`step ${step.id} broadcast`, broadcast);

            dispatch(
                stakingActions.stepReset({
                    sessionKey,
                    stepId: step.id,
                    error: { kind: 'broadcast-failed', code: broadcast.code },
                }),
            );

            dispatch(
                transactionsActions.transactionBroadcastStatus({ account, flow, status: 'error' }),
            );

            return rejectWithValue('adapter-failed');
        }

        const { txid } = broadcast.payload;

        dispatch(stakingActions.stepBroadcast({ sessionKey, stepId: step.id, txid }));

        await dispatch(
            notifyEarnTransactionBroadcastThunk({
                account,
                device: selectSelectedDevice(getState()),
                txid,
                flow,
            }),
        );

        if (step.awaitConfirmation) {
            dispatch(trackStakingStepConfirmationThunk({ sessionKey, stepId: step.id }));
        } else {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        }

        return { txid };
    },
);
