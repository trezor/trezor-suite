import { initialTronStakeState, tronStakeActions, tronStakeReducer } from '../tronStakeReducer';

describe('tronStakeReducer', () => {
    it('starts on the freeze step', () => {
        expect(tronStakeReducer(undefined, { type: '@@INIT' })).toEqual(initialTronStakeState);
    });

    it('goToStep updates the step', () => {
        const state = tronStakeReducer(undefined, tronStakeActions.goToStep({ step: 'complete' }));

        expect(state.step).toBe('complete');
    });

    it('reset returns to the freeze step', () => {
        const advanced = tronStakeReducer(undefined, tronStakeActions.goToStep({ step: 'vote' }));
        const state = tronStakeReducer(advanced, tronStakeActions.reset());

        expect(state.step).toBe('freeze');
    });
});
