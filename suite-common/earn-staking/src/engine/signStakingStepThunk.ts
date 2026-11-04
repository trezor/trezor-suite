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
    selectStakingStepContext,
    selectStakingStepStatus,
} from '../state/stakingSessionSelectors';

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
    async ({ sessionKey, feeLevel }, { dispatch, getState, extra, rejectWithValue }) => {
        const stepContext = selectStakingStepContext(getState(), sessionKey);

        if (!stepContext.success) {
            return rejectWithValue(stepContext.rejection);
        }

        const { session, step, planStep, account } = stepContext.context;
        const adapter = extra.services.staking.stakingProductRepository.get(session.plan.productId);

        if (step.status !== 'composed') {
            return rejectWithValue('step-not-ready');
        }

        const level = step.composed.feeLevels[feeLevel];

        if (level?.type !== 'final') {
            return rejectWithValue('step-not-ready');
        }

        const reportSigningCancelled = () =>
            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: { txType: 'stake', networkSymbol: account.symbol, stage: 'signing' },
            });

        dispatch(
            stakingActions.stepSigning({
                sessionKey,
                stepId: step.id,
                feeLevel,
                signingStartedAt: Date.now(),
            }),
        );

        const signed = await callStakingAdapter(() =>
            extra.services.staking.deviceAccess.run(() => {
                if (selectStakingStepStatus(getState(), session, step.id) !== 'signing') {
                    throw new StakingAdapterError(STAKING_SIGNING_ERROR_CODES.cancelled);
                }

                return adapter.signStep({
                    account,
                    plan: session.plan,
                    step: planStep,
                    composedStep: step.composed,
                    feeLevel,
                });
            }),
        );

        if (!signed.success) {
            if (signed.code === STAKING_SIGNING_ERROR_CODES.cancelled) {
                dispatch(stakingActions.stepReset({ sessionKey, stepId: step.id, error: null }));

                reportSigningCancelled();

                return rejectWithValue('cancelled');
            }

            if (signed.code === STAKING_SIGNING_ERROR_CODES.expired) {
                dispatch(
                    stakingActions.stepReset({
                        sessionKey,
                        stepId: step.id,
                        error: { kind: 'expired', code: null },
                    }),
                );

                return rejectWithValue('step-expired');
            }

            warnStakingAdapterFailure(`step ${step.id} sign`, signed);

            dispatch(
                stakingActions.stepReset({
                    sessionKey,
                    stepId: step.id,
                    error: { kind: 'sign-failed', code: signed.code },
                }),
            );

            return rejectWithValue('adapter-failed');
        }

        if (selectStakingStepStatus(getState(), session, step.id) !== 'signing') {
            reportSigningCancelled();

            return rejectWithValue('cancelled');
        }

        assertSignedStakingStep(signed.payload);

        dispatch(
            stakingActions.stepSigned({ sessionKey, stepId: step.id, signed: signed.payload }),
        );

        return signed.payload;
    },
);
