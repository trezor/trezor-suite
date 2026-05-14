import { configureMockStore } from '@suite-common/test-utils';

import { recoveryActions, recoveryReducer } from '../src';

const initStore = () =>
    configureMockStore({
        preloadedState: {
            recovery: recoveryReducer(undefined, { type: 'foo' }),
        },
        reducer: (state: any, action: any) => ({
            ...state,
            recovery: recoveryReducer(state.recovery, action),
        }),
    });

describe('Recovery Slice', () => {
    it('setWordsCount', () => {
        const store = initStore();

        // default state
        const stateBefore = store.getState().recovery;
        expect(stateBefore.wordsCount).toEqual(12);

        store.dispatch(recoveryActions.setWordsCount(18));

        const stateAfter = store.getState().recovery;
        expect(stateAfter.wordsCount).toEqual(18);

        // should not trigger side-effect actions
        expect(store.getActions().length).toEqual(1);
    });

    it('setAdvancedRecovery', () => {
        const store = initStore();

        // default state
        const stateBefore = store.getState().recovery;
        expect(stateBefore.advancedRecovery).toEqual(false);

        store.dispatch(recoveryActions.setAdvancedRecovery(true));

        const stateAfter = store.getState().recovery;
        expect(stateAfter.advancedRecovery).toEqual(true);

        // should not trigger side-effect actions
        expect(store.getActions().length).toEqual(1);
    });

    it('setStatus', () => {
        const store = initStore();
        store.dispatch(recoveryActions.setStatus('finished'));
        expect(store.getState().recovery.status).toEqual('finished');
    });

    it('resetReducer', () => {
        const store = initStore();
        store.dispatch(recoveryActions.setStatus('finished'));
        expect(store.getState().recovery.status).toEqual('finished');
        store.dispatch(recoveryActions.resetReducer());
        expect(store.getState().recovery.status).toEqual('initial');
    });
});
