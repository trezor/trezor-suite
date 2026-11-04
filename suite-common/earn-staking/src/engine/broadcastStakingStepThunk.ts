import { selectSelectedDevice } from '@suite-common/device';
import {
    fetchAndUpdateAccountThunk,
    notifyEarnTransactionBroadcastThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import { callStakingAdapter, warnStakingAdapterFailure } from './callStakingAdapter';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import { getEarnTransactionFlow } from './getEarnTransactionFlow';
import type { StakingEngineRejection } from './stakingEngineRejection';
import {
    type TrackStakingStepConfirmationThunkDeps,
    type TrackStakingStepConfirmationThunkState,
    trackStakingStepConfirmationThunk,
} from './trackStakingStepConfirmationThunk';
import { stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import {
    selectStakingStepContext,
    selectStakingStepStatus,
} from '../state/stakingSessionSelectors';
import { isStakingReviewStep } from '../state/stakingSessionStep';
import { transitionStakingStep } from '../state/stakingStepTransition';

type BroadcastStakingStepParams = {
    sessionKey: StakingSessionKey;
};

export type BroadcastStakingStepThunkState = TrackStakingStepConfirmationThunkState;

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

        const broadcastingStep = isStakingReviewStep(step)
            ? transitionStakingStep(step, { type: 'broadcasting', attemptId: step.attemptId })
            : null;

        if (broadcastingStep?.status !== 'broadcasting') {
            return rejectWithValue('step-not-ready');
        }

        const attempt = { sessionKey, stepId: step.id, attemptId: broadcastingStep.attemptId };

        if (broadcastingStep.expiresAt !== null && broadcastingStep.expiresAt < Date.now()) {
            dispatch(stakingActions.stepExpired(attempt));

            return rejectWithValue('step-expired');
        }

        dispatch(stakingActions.stepBroadcasting(attempt));

        if (selectStakingStepStatus(getState(), session, step.id) !== 'broadcasting') {
            return rejectWithValue('step-not-ready');
        }

        const flow = getEarnTransactionFlow(session.plan.operation);

        const broadcast = await callStakingAdapter(() =>
            adapter.broadcastStep({
                account,
                plan: session.plan,
                step: planStep,
                signedStep: broadcastingStep.signed,
            }),
        );

        if (!broadcast.success) {
            warnStakingAdapterFailure(`step ${step.id} broadcast`, broadcast);

            dispatch(stakingActions.stepBroadcastFailed({ ...attempt, code: broadcast.code }));

            dispatch(
                transactionsActions.transactionBroadcastStatus({ account, flow, status: 'error' }),
            );

            return rejectWithValue('adapter-failed');
        }

        const { txid } = broadcast.payload;

        dispatch(stakingActions.stepBroadcast({ ...attempt, txid }));

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
