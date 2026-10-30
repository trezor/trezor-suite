import { mockStakingProductDescriptor } from './mockStakingProductDescriptor';
import { type StakingPlan, type StakingStep, stakingAmountSchema } from '../src';

export const mockStakingStep = (overrides: Partial<StakingStep> = {}): StakingStep => ({
    id: 'stake',
    kind: 'stake',
    awaitConfirmation: false,
    review: 'app-and-device',
    payload: { to: '0xD523794C879D9eC028960a231F866758e405bE34' },
    ...overrides,
});

export const mockStakingPlan = (overrides: Partial<StakingPlan> = {}): StakingPlan => ({
    productId: mockStakingProductDescriptor().id,
    operation: 'stake',
    amount: stakingAmountSchema.parse('1000000000000000000'),
    options: {},
    steps: [mockStakingStep()],
    ...overrides,
});
