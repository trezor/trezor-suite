import {
    type StakingAmount,
    type StakingOperation,
    type StakingOperationOptions,
    type StakingProductId,
    type StakingStep,
    assertStakingPlan,
} from '@suite-common/earn-staking-common';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { getWeakRandomId } from '@trezor/utils';

import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import type { StakingEngineRejection } from './stakingEngineRejection';
import { callStakingAdapter, warnStakingAdapterFailure } from './stakingStepContext';
import type { StakingDep } from '../stakingServices';
import { type StakingRootState, stakingActions } from '../state/stakingReducer';
import { selectStakingPosition, selectStakingProductDescriptor } from '../state/stakingSelectors';
import { type StakingSessionKey, getStakingSessionKey } from '../state/stakingSessionKey';
import { selectIsStakingSessionActive } from '../state/stakingSessionSelectors';
import type { StakingSession, StakingSessionStep } from '../state/stakingSessionsReducer';

const STAKING_SESSION_ID_LENGTH = 10;

const toPendingStep = (step: StakingStep): StakingSessionStep => ({
    id: step.id,
    kind: step.kind,
    awaitConfirmation: step.awaitConfirmation,
    review: step.review,
    error: null,
    status: 'pending',
});

type PlanStakingOperationParams = {
    accountKey: AccountKey;
    productId: StakingProductId;
    operation: StakingOperation;
    amount: StakingAmount | null;
    options: StakingOperationOptions;
};

export type PlanStakingOperationThunkState = StakingRootState & AccountsRootState;

export type PlanStakingOperationThunkDeps = WithServices<StakingDep>;

export const planStakingOperationThunk = createThunk<
    StakingSessionKey,
    PlanStakingOperationParams,
    {
        state: PlanStakingOperationThunkState;
        extra: PlanStakingOperationThunkDeps;
        rejectValue: StakingEngineRejection;
    }
>(
    `${STAKING_ENGINE_ACTION_PREFIX}/planStakingOperation`,
    async (
        { accountKey, productId, operation, amount, options },
        { dispatch, getState, extra, rejectWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (account === null) {
            return rejectWithValue('account-not-found');
        }

        if (selectStakingProductDescriptor(getState(), productId) === null) {
            return rejectWithValue('product-not-found');
        }

        const sessionKey = getStakingSessionKey({ accountKey, productId, operation });

        if (selectIsStakingSessionActive(getState(), sessionKey)) {
            return rejectWithValue('session-active');
        }

        const adapter = extra.services.staking.stakingProductRepository.get(productId);

        const planned = await callStakingAdapter(() =>
            adapter.planOperation({
                account,
                position: selectStakingPosition(getState(), accountKey, productId),
                operation,
                options,
                amount,
            }),
        );

        if (!planned.success) {
            warnStakingAdapterFailure(`${operation} plan`, planned);

            return rejectWithValue('adapter-failed');
        }

        assertStakingPlan(planned.payload);

        if (selectIsStakingSessionActive(getState(), sessionKey)) {
            return rejectWithValue('session-active');
        }

        const session: StakingSession = {
            id: getWeakRandomId(STAKING_SESSION_ID_LENGTH),
            key: sessionKey,
            accountKey,
            plan: planned.payload,
            steps: planned.payload.steps.map(toPendingStep),
            createdAt: Date.now(),
        };

        dispatch(stakingActions.sessionStarted({ session }));

        return sessionKey;
    },
);
