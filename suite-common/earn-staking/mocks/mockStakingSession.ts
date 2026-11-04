import { mockStakingPlan } from '@suite-common/earn-staking-common/mocks';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getStakingSessionKey } from '../src/state/stakingSessionKey';
import type { StakingSessionStep, StakingStepError } from '../src/state/stakingSessionStep';
import type { StakingSession } from '../src/state/stakingSessionsReducer';

type MockStakingSessionStepParams = {
    id?: string;
    kind?: StakingSessionStep['kind'];
    awaitConfirmation?: boolean;
    review?: StakingSessionStep['review'];
    error?: StakingStepError | null;
};

export const mockStakingSessionStep = (
    overrides: MockStakingSessionStepParams = {},
): StakingSessionStep => ({
    id: 'stake',
    kind: 'stake',
    awaitConfirmation: false,
    review: 'app-and-device',
    error: null,
    status: 'pending',
    ...overrides,
});

export const mockStakingSession = (overrides: Partial<StakingSession> = {}): StakingSession => {
    const accountKey = overrides.accountKey ?? mockAccountKey({ symbol: asNetworkSymbol('eth') });
    const plan = overrides.plan ?? mockStakingPlan();

    return {
        id: 'session-1',
        key: getStakingSessionKey({
            accountKey,
            productId: plan.productId,
            operation: plan.operation,
        }),
        accountKey,
        plan,
        steps: plan.steps.map(step =>
            mockStakingSessionStep({
                id: step.id,
                kind: step.kind,
                awaitConfirmation: step.awaitConfirmation,
                review: step.review,
            }),
        ),
        createdAt: 1_777_000_000_000,
        ...overrides,
    };
};
