import {
    assertComposedStakingStep,
    assertStakingPlan,
    assertStakingPosition,
} from './stakingAssertions';
import { mockComposedStakingStep, mockStakingPlan, mockStakingPosition } from '../mocks';

describe('staking assertions', () => {
    it('accepts a valid position', () => {
        expect(() => assertStakingPosition(mockStakingPosition())).not.toThrow();
    });

    it('names the invalid field of a position', () => {
        const position = mockStakingPosition();

        expect(() =>
            assertStakingPosition({
                ...position,
                balances: { ...position.balances, rewards: '0.1' as never },
            }),
        ).toThrow(/balances\.rewards/);
    });

    it('accepts a valid plan', () => {
        expect(() => assertStakingPlan(mockStakingPlan())).not.toThrow();
    });

    it('names the invalid field of a plan', () => {
        expect(() => assertStakingPlan({ ...mockStakingPlan(), steps: [] })).toThrow(/steps/);
    });

    it('accepts a valid composed step', () => {
        expect(() => assertComposedStakingStep(mockComposedStakingStep())).not.toThrow();
    });

    it('names the invalid fee level of a composed step', () => {
        const composedStep = mockComposedStakingStep();

        expect(() =>
            assertComposedStakingStep({
                ...composedStep,
                feeLevels: { normal: { type: 'final', fee: '1' } as never },
            }),
        ).toThrow(/feeLevels\.normal/);
    });
});
