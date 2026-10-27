import { stakingPlanSchema } from './stakingPlan';
import { mockStakingPlan, mockStakingStep } from '../mocks';

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
