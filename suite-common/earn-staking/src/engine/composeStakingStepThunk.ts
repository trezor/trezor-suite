import {
    type ComposedStakingStep,
    type StakingCustomFee,
    assertComposedStakingStep,
    stakingCustomFeeSchema,
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
    selectIsStakingSessionCurrent,
    selectStakingSessionStep,
    selectStakingStepContext,
} from '../state/stakingSessionSelectors';
import { transitionStakingStep } from '../state/stakingStepTransition';

type ComposeStakingStepParams = {
    sessionKey: StakingSessionKey;
    customFee?: StakingCustomFee;
};

export type ComposeStakingStepThunkState = StakingRootState & AccountsRootState;

export type ComposeStakingStepThunkDeps = WithServices<StakingDep>;

export const composeStakingStepThunk = createThunk<
    ComposedStakingStep,
    ComposeStakingStepParams,
    {
        state: ComposeStakingStepThunkState;
        extra: ComposeStakingStepThunkDeps;
        rejectValue: StakingEngineRejection;
    }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/composeStakingStep`,
    async (
        { sessionKey, customFee },
        { dispatch, getState, extra, rejectWithValue, requestId: attemptId },
    ) => {
        const parsedCustomFee =
            customFee === undefined ? null : stakingCustomFeeSchema.safeParse(customFee);

        if (parsedCustomFee !== null && !parsedCustomFee.success) {
            return rejectWithValue('invalid-custom-fee');
        }

        const stepContext = selectStakingStepContext(getState(), sessionKey);

        if (!stepContext.success) {
            return rejectWithValue(stepContext.rejection);
        }

        const { session, step, planStep, account } = stepContext.context;
        const adapter = extra.services.staking.stakingProductRepository.get(session.plan.productId);

        if (transitionStakingStep(step, { type: 'composing', attemptId }) === null) {
            return rejectWithValue('step-not-ready');
        }

        const attempt = { sessionKey, stepId: step.id, attemptId };

        const isAttemptComposing = () => {
            const current = selectStakingSessionStep(getState(), session, step.id);

            return (
                (current?.status === 'pending' || current?.status === 'composed') &&
                current.composeAttemptId === attemptId
            );
        };

        dispatch(stakingActions.stepComposing(attempt));

        if (!isAttemptComposing()) {
            return rejectWithValue('step-not-ready');
        }

        const composed = await callStakingAdapter(() =>
            adapter.composeStep({
                account,
                plan: session.plan,
                step: planStep,
                customFee: parsedCustomFee === null ? null : parsedCustomFee.data,
            }),
        );

        if (!selectIsStakingSessionCurrent(getState(), session)) {
            return rejectWithValue('session-replaced');
        }

        if (!isAttemptComposing()) {
            return rejectWithValue('attempt-superseded');
        }

        if (!composed.success) {
            warnStakingAdapterFailure(`step ${step.id} compose`, composed);

            dispatch(
                stakingActions.stepComposeFailed({
                    ...attempt,
                    error: { kind: 'compose-failed', code: composed.code },
                }),
            );

            return rejectWithValue('adapter-failed');
        }

        assertComposedStakingStep(composed.payload);

        dispatch(stakingActions.stepComposed({ ...attempt, composed: composed.payload }));

        return composed.payload;
    },
);
