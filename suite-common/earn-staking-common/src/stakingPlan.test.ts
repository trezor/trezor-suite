import {
    composedStakingStepSchema,
    signedStakingStepSchema,
    stakingPlanSchema,
} from './stakingPlan';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingPlan,
    mockStakingStep,
} from '../mocks';

describe('stakingPlanSchema', () => {
    it('parses a plan unchanged', () => {
        const plan = mockStakingPlan();

        expect(stakingPlanSchema.parse(plan)).toEqual(plan);
    });

    it('keeps multi-step plans in order with their payloads', () => {
        const plan = mockStakingPlan({
            operation: 'stake',
            steps: [
                mockStakingStep({ id: 'freeze', kind: 'freeze', awaitConfirmation: true }),
                mockStakingStep({ id: 'vote', kind: 'vote', payload: { votes: 3 } }),
            ],
        });

        expect(stakingPlanSchema.parse(plan)).toEqual(plan);
    });

    it('accepts an operation without an amount', () => {
        const plan = mockStakingPlan({ operation: 'claim', amount: null });

        expect(stakingPlanSchema.parse(plan)).toEqual(plan);
    });

    it('rejects a plan without steps', () => {
        const result = stakingPlanSchema.safeParse({ ...mockStakingPlan(), steps: [] });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['steps']);
    });

    it('rejects an unknown key on the plan or a step', () => {
        expect(stakingPlanSchema.safeParse({ ...mockStakingPlan(), fee: '1' }).success).toBe(false);
        expect(
            stakingPlanSchema.safeParse({
                ...mockStakingPlan(),
                steps: [{ ...mockStakingStep(), title: 'Stake' }],
            }).success,
        ).toBe(false);
    });

    it('rejects an unknown step kind', () => {
        const result = stakingPlanSchema.safeParse({
            ...mockStakingPlan(),
            steps: [mockStakingStep({ kind: 'teleport' as never })],
        });

        expect(result.success).toBe(false);
    });

    it('rejects an option value that is not serializable', () => {
        const result = stakingPlanSchema.safeParse({
            ...mockStakingPlan(),
            options: { drep: () => 'abstain' },
        });

        expect(result.success).toBe(false);
    });
});

describe('composedStakingStepSchema', () => {
    it('parses a composed step unchanged', () => {
        const composedStep = mockComposedStakingStep();

        expect(composedStakingStepSchema.parse(composedStep)).toEqual(composedStep);
    });

    it('accepts a solana validity window and an opaque unsigned transaction', () => {
        const composedStep = mockComposedStakingStep({
            validityMs: 24_000,
            unsignedTx: { message: 'AQAB', lastValidBlockHeight: 123 },
        });

        expect(composedStakingStepSchema.parse(composedStep)).toEqual(composedStep);
    });

    it('rejects a validity window that is not a positive integer', () => {
        expect(
            composedStakingStepSchema.safeParse(mockComposedStakingStep({ validityMs: 0 })).success,
        ).toBe(false);
        expect(
            composedStakingStepSchema.safeParse(mockComposedStakingStep({ validityMs: 1.5 }))
                .success,
        ).toBe(false);
    });

    it('rejects an output without an address', () => {
        const result = composedStakingStepSchema.safeParse(
            mockComposedStakingStep({
                outputs: [{ address: '', amount: '1' as never }],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['outputs', 0, 'address']);
    });

    it('rejects an expiry stamped by the adapter', () => {
        const result = composedStakingStepSchema.safeParse({
            ...mockComposedStakingStep(),
            expiresAt: 1_777_000_000_000,
        });

        expect(result.success).toBe(false);
    });
});

describe('signedStakingStepSchema', () => {
    it('parses a signed step unchanged', () => {
        const signedStep = mockSignedStakingStep();

        expect(signedStakingStepSchema.parse(signedStep)).toEqual(signedStep);
    });

    it('rejects an empty serialized transaction', () => {
        expect(signedStakingStepSchema.safeParse({ serializedTx: '' }).success).toBe(false);
    });
});
