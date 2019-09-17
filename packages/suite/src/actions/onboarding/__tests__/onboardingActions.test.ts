/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import { OnboardingState } from '@suite/types/onboarding/onboarding';
import * as onboardingActions from '../onboardingActions';
import { Action } from '@suite-types';

export const getInitialState = (custom?: any): { onboarding: OnboardingState } => {
    return {
        onboarding: {
            ...onboardingReducer(undefined, {} as Action),
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
    const store = createStore(initialState);
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

    it('addPath: should add unique entry', async () => {
        const store = mockStore(
            getInitialState({
                path: ['new'],
            }),
        );
        await store.dispatch(onboardingActions.addPath('create'));
        const stateAfter = store.getState().onboarding;
        expect(stateAfter.path).toEqual(['new', 'create']);
    });

    it('addPath: should not add duplicit entry', async () => {
        const store = mockStore(
            getInitialState({
                path: ['create'],
            }),
        );
        await store.dispatch(onboardingActions.addPath('create'));
        const stateAfter = store.getState().onboarding;
        expect(stateAfter.path).toEqual(['create']);
    });

    it('removePath: one element', async () => {
        const store = mockStore(
            getInitialState({
                path: ['create', 'new'],
            }),
        );
        await store.dispatch(onboardingActions.removePath(['create']));
        const stateAfter = store.getState().onboarding;
        expect(stateAfter.path).toEqual(['new']);
    });

    it('removePath: multiple elements', async () => {
        const store = mockStore(
            getInitialState({
                path: ['create', 'new', 'used'],
            }),
        );
        await store.dispatch(onboardingActions.removePath(['create', 'new']));
        const stateAfter = store.getState().onboarding;
        expect(stateAfter.path).toEqual(['used']);
    });

    it('resetOnboarding: should set onboarding reducer to initial state', () => {
        // set some data
        const store = mockStore(
            getInitialState({
                path: ['create', 'new', 'used'],
                activeStepId: 'recovery',
            }),
        );
        store.dispatch(onboardingActions.resetOnboarding());
        const stateAfter = store.getState().onboarding;
        expect(stateAfter).toEqual(getInitialState().onboarding);
    });
});
