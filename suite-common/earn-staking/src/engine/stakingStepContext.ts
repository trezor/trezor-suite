import {
    type StakingProductAdapter,
    type StakingStep,
    isStakingAdapterError,
} from '@suite-common/earn-staking-common';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';

import type { StakingEngineRejection } from './stakingEngineRejection';
import type { StakingProductRepository } from '../repository/createStakingProductRepository';
import type { StakingRootState } from '../state/stakingReducer';
import type { StakingSessionKey } from '../state/stakingSessionKey';
import { getStakingCurrentStep, selectStakingSession } from '../state/stakingSessionSelectors';
import type { StakingSession, StakingSessionStep } from '../state/stakingSessionsReducer';

export type StakingStepContext = {
    session: StakingSession;
    step: StakingSessionStep;
    planStep: StakingStep;
    account: Account;
    adapter: StakingProductAdapter;
};

export type StakingStepContextResult =
    | { success: true; context: StakingStepContext }
    | { success: false; rejection: StakingEngineRejection };

export type GetStakingStepContextParams = {
    state: StakingRootState & AccountsRootState;
    sessionKey: StakingSessionKey;
    stakingProductRepository: StakingProductRepository;
};

export const getStakingStepContext = ({
    state,
    sessionKey,
    stakingProductRepository,
}: GetStakingStepContextParams): StakingStepContextResult => {
    const session = selectStakingSession(state, sessionKey);

    if (session === null) {
        return { success: false, rejection: 'session-not-found' };
    }

    const step = getStakingCurrentStep(session);
    const planStep = session.plan.steps.find(candidate => candidate.id === step?.id);

    if (step === null || planStep === undefined) {
        return { success: false, rejection: 'step-not-ready' };
    }

    const account = selectAccountByKey(state, session.accountKey);

    if (account === null) {
        return { success: false, rejection: 'account-not-found' };
    }

    const adapter = stakingProductRepository.get(session.plan.productId);

    const context = { session, step, planStep, account, adapter } satisfies StakingStepContext;

    return { success: true, context };
};

export const isStakingSessionCurrent = (state: StakingRootState, session: StakingSession) =>
    selectStakingSession(state, session.key)?.id === session.id;

export type StakingAdapterCallResult<T> =
    { success: true; payload: T } | { success: false; code: string | null; error: unknown };

export const callStakingAdapter = async <T>(
    call: () => Promise<T>,
): Promise<StakingAdapterCallResult<T>> => {
    try {
        const payload = await call();

        return { success: true, payload };
    } catch (error) {
        const code = isStakingAdapterError(error) ? error.code : null;

        return { success: false, code, error };
    }
};

// Only the adapter's code or the error's name is logged: a Connect rejection message can embed the
// composed account payload.
export const warnStakingAdapterFailure = (
    subject: string,
    failure: Extract<StakingAdapterCallResult<unknown>, { success: false }>,
) => {
    const reason =
        failure.code ?? (failure.error instanceof Error ? failure.error.name : 'unknown error');

    console.warn(`Staking ${subject} failed: ${reason}`);
};
