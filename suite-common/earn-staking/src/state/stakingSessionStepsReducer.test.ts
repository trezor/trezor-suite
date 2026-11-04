import {
    mockComposedStakingStep,
    mockSignedStakingStep,
} from '@suite-common/earn-staking-common/mocks';

import {
    stakingSessionStepsActions as actions,
    stakingSessionStepsReducer,
} from './stakingSessionStepsReducer';
import { mockStakingSession, mockStakingSessionStep } from '../../mocks';

const { key: sessionKey } = mockStakingSession();
const stake = { sessionKey, stepId: 'stake' };
const pendingStake = mockStakingSessionStep({ id: 'stake' });
const pendingVote = mockStakingSessionStep({ id: 'vote', kind: 'vote' });
const steps = [pendingStake, pendingVote];

describe('stakingSessionStepsReducer', () => {
    it('keeps the steps for an action that is not a step transition', () => {
        expect(stakingSessionStepsReducer(steps, { type: 'init' })).toBe(steps);
    });

    it('keeps the steps for an unknown step or a refused transition', () => {
        expect(
            stakingSessionStepsReducer(
                steps,
                actions.stepComposed({
                    sessionKey,
                    stepId: 'missing',
                    composed: mockComposedStakingStep(),
                }),
            ),
        ).toBe(steps);
        expect(
            stakingSessionStepsReducer(
                steps,
                actions.stepSigned({ ...stake, signed: mockSignedStakingStep() }),
            ),
        ).toBe(steps);
    });

    it('replaces only the step the action names', () => {
        const composed = mockComposedStakingStep();
        const next = stakingSessionStepsReducer(
            steps,
            actions.stepComposed({ ...stake, composed }),
        );

        expect(next).not.toBe(steps);
        expect(next[0]).toEqual({ ...pendingStake, status: 'composed', composed });
        expect(next[1]).toBe(pendingVote);
    });
});
