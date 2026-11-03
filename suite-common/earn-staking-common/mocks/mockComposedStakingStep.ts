import { mockStakingFeeLevels } from './mockStakingFeeLevels';
import { type ComposedStakingStep, type SignedStakingStep, stakingAmountSchema } from '../src';

export const mockComposedStakingStep = (
    overrides: Partial<ComposedStakingStep> = {},
): ComposedStakingStep => ({
    feeLevels: mockStakingFeeLevels(),
    outputs: [
        {
            address: '0xD523794C879D9eC028960a231F866758e405bE34',
            amount: stakingAmountSchema.parse('1000000000000000000'),
        },
    ],
    unsignedTx: { to: '0xD523794C879D9eC028960a231F866758e405bE34', data: '0x3a4b66f1' },
    validityMs: null,
    ...overrides,
});

export const mockSignedStakingStep = (
    overrides: Partial<SignedStakingStep> = {},
): SignedStakingStep => ({
    serializedTx:
        '0x02f8700180843b9aca00850430e2340083035b6094d523794c879d9ec028960a231f866758e405be34',
    ...overrides,
});
