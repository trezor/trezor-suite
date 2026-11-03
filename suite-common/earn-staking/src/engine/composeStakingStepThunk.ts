import {
    type ComposedStakingStep,
    type StakingCustomFee,
    assertComposedStakingStep,
} from '@suite-common/earn-staking-common';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import type { StakingEngineRejection } from './stakingEngineRejection';
import {
    callStakingAdapter,
    getStakingStepContext,
    isStakingSessionCurrent,
    warnStakingAdapterFailure,
} from './stakingStepContext';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';

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
    async ({ sessionKey, customFee }, { dispatch, getState, extra, rejectWithValue }) => {
        const { stakingProductRepository } = extra.services.staking;

        const resolved = getStakingStepContext({
            state: getState(),
            sessionKey,
            stakingProductRepository,
        });

        if (!resolved.success) {
            return rejectWithValue(resolved.rejection);
        }

        const { session, step, planStep, account, adapter } = resolved.context;

        if (step.status !== 'pending' && step.status !== 'composed') {
            return rejectWithValue('step-not-ready');
        }

        const composed = await callStakingAdapter(() =>
            adapter.composeStep({
                account,
                plan: session.plan,
                step: planStep,
                customFee: customFee ?? null,
            }),
        );

        if (!isStakingSessionCurrent(getState(), session)) {
            return rejectWithValue('session-replaced');
        }

        if (!composed.success) {
            warnStakingAdapterFailure(`step ${step.id} compose`, composed);

            dispatch(
                stakingActions.stepComposeFailed({
                    sessionKey,
                    stepId: step.id,
                    error: { kind: 'compose-failed', code: composed.code },
                }),
            );

            return rejectWithValue('adapter-failed');
        }

        assertComposedStakingStep(composed.payload);

        dispatch(
            stakingActions.stepComposed({
                sessionKey,
                stepId: step.id,
                composed: composed.payload,
            }),
        );

        return composed.payload;
    },
);
