import { type AnalyticsDep, events } from '@suite-common/analytics';
import {
    STAKING_SIGNING_ERROR_CODES,
    type SignedStakingStep,
    StakingAdapterError,
    type StakingFeeLevelLabel,
    assertSignedStakingStep,
} from '@suite-common/earn-staking-common';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import { callStakingAdapter, warnStakingAdapterFailure } from './callStakingAdapter';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import type { StakingEngineRejection } from './stakingEngineRejection';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import {
    selectStakingSessionStep,
    selectStakingStepContext,
} from '../state/stakingSessionSelectors';
import { type StakingStepEvent, transitionStakingStep } from '../state/stakingStepTransition';

type SignStakingStepParams = {
    sessionKey: StakingSessionKey;
    feeLevel: StakingFeeLevelLabel;
};

export type SignStakingStepThunkState = StakingRootState & AccountsRootState;

export type SignStakingStepThunkDeps = WithServices<StakingDep & AnalyticsDep>;

export const signStakingStepThunk = createThunk<
    SignedStakingStep,
    SignStakingStepParams,
    {
        state: SignStakingStepThunkState;
        extra: SignStakingStepThunkDeps;
        rejectValue: StakingEngineRejection;
    }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/signStakingStep`,
    async (
        { sessionKey, feeLevel },
        { dispatch, getState, extra, rejectWithValue, requestId: attemptId },
    ) => {
        const stepContext = selectStakingStepContext(getState(), sessionKey);

        if (!stepContext.success) {
            return rejectWithValue(stepContext.rejection);
        }

        const { session, step, planStep, account } = stepContext.context;
        const adapter = extra.services.staking.stakingProductRepository.get(session.plan.productId);

        const signingEvent: StakingStepEvent = {
            type: 'signing',
            attemptId,
            feeLevel,
            signingStartedAt: Date.now(),
        };

        const signingStep = transitionStakingStep(step, signingEvent);

        if (signingStep?.status !== 'signing') {
            return rejectWithValue('step-not-ready');
        }

        const attempt = { sessionKey, stepId: step.id, attemptId };

        const isAttemptSigning = () => {
            const current = selectStakingSessionStep(getState(), session, step.id);

            return current?.status === 'signing' && current.attemptId === attemptId;
        };

        const reportSigningCancelled = () =>
            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: { txType: 'stake', networkSymbol: account.symbol, stage: 'signing' },
            });

        dispatch(
            stakingActions.stepSigning({
                ...attempt,
                feeLevel: signingEvent.feeLevel,
                signingStartedAt: signingEvent.signingStartedAt,
            }),
        );

        if (!isAttemptSigning()) {
            return rejectWithValue('step-not-ready');
        }

        const signed = await callStakingAdapter(() =>
            extra.services.staking.deviceAccess.run(attemptId, () => {
                if (!isAttemptSigning()) {
                    throw new StakingAdapterError(STAKING_SIGNING_ERROR_CODES.cancelled);
                }

                return adapter.signStep({
                    account,
                    plan: session.plan,
                    step: planStep,
                    composedStep: signingStep.composed,
                    feeLevel,
                });
            }),
        );

        if (!signed.success) {
            if (signed.code === STAKING_SIGNING_ERROR_CODES.cancelled) {
                dispatch(stakingActions.stepCancelled(attempt));

                reportSigningCancelled();

                return rejectWithValue('cancelled');
            }

            if (signed.code === STAKING_SIGNING_ERROR_CODES.expired) {
                dispatch(stakingActions.stepExpired(attempt));

                return rejectWithValue('step-expired');
            }

            warnStakingAdapterFailure(`step ${step.id} sign`, signed);

            dispatch(stakingActions.stepSignFailed({ ...attempt, code: signed.code }));

            return rejectWithValue('adapter-failed');
        }

        if (!isAttemptSigning()) {
            reportSigningCancelled();

            return rejectWithValue('cancelled');
        }

        assertSignedStakingStep(signed.payload);

        dispatch(stakingActions.stepSigned({ ...attempt, signed: signed.payload }));

        return signed.payload;
    },
);
