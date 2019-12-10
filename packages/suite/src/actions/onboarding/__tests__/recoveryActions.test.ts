import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import recoveryReducer from '@onboarding-reducers/recoveryReducer';
import { RecoveryState, RecoveryActionTypes } from '@suite/types/onboarding/recovery';
import * as recoveryActions from '../recoveryActions';

export const getInitialState = (custom?: any): { recovery: RecoveryState } => {
    return {
        recovery: {
            ...recoveryReducer(undefined, {} as RecoveryActionTypes),
            ...custom,
        },
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureStore<ReturnType<typeof getInitialState>, any>([thunk])(initialState);
    return store;
};

const updateStore = (store: ReturnType<typeof createStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action: RecoveryActionTypes = store.getActions().pop();
        const { recovery } = store.getState();

        store.getState().recovery = recoveryReducer(recovery, action);
        // add action back to stack
        store.getActions().push(action);
    });
};

const mockStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = createStore(initialState);
    store.subscribe(() => updateStore(store));
    return store;
};

describe('Recovery Actions', () => {
    it('setWordsCount', async () => {
        const store = mockStore(getInitialState());

        // default state
        const stateBefore = store.getState().recovery;
        expect(stateBefore.wordsCount).toEqual(12);

        await store.dispatch(recoveryActions.setWordsCount(18));

        const stateAfter = store.getState().recovery;
        expect(stateAfter.wordsCount).toEqual(18);

        // should not trigger side-effect actions
        expect(store.getActions().length).toEqual(1);
    });

    it('setAdvancedRecovery', async () => {
        const store = mockStore(getInitialState());

        // default state
        const stateBefore = store.getState().recovery;
        expect(stateBefore.advancedRecovery).toEqual(false);

        await store.dispatch(recoveryActions.setAdvancedRecovery(true));

        const stateAfter = store.getState().recovery;
        expect(stateAfter.advancedRecovery).toEqual(true);

        // should not trigger side-effect actions
        expect(store.getActions().length).toEqual(1);
    });
});
