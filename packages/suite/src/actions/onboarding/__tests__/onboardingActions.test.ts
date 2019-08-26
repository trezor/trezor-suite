/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import * as onboardingActions from '../onboardingActions';

export const getInitialState = (custom = {}) => {
    return {
        onboarding: {
            selectedModel: null,
            activeStepId: 'welcome',
            activeSubStep: null,
            path: [],
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
        const action = store.getActions().pop();
        const { onboarding } = store.getState();

        // @ts-ignore
        store.getState().onboarding = onboardingReducer(onboarding, action);
        // add action back to stack
        store.getActions().push(action);
    });
};

const mockStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = createStore(initialState)
    store.subscribe(() => updateStore(store)); 
    return store; 
};

describe('Onboarding Actions', () => {
    it('goToNextStep', async () => {
        const store = mockStore(getInitialState());

        const stateBefore = store.getState().onboarding;
        expect(stateBefore.activeStepId).toEqual('welcome');

        await store.dispatch(onboardingActions.goToNextStep());

        const stateAfter = store.getState().onboarding;
        expect(stateAfter.activeStepId).toEqual('new-or-used');
    });

    it('goToPreviousStep', async () => {
        const store = mockStore(
            getInitialState({
                activeStepId: 'new-or-used',
            }),
        );

        const stateBefore = store.getState().onboarding;
        expect(stateBefore.activeStepId).toEqual('new-or-used');

        await store.dispatch(onboardingActions.goToPreviousStep());

        const stateAfter = store.getState().onboarding;
        expect(stateAfter.activeStepId).toEqual('welcome');
    });
});
