/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import { OnboardingState } from '@suite/types/onboarding/onboarding';
import fixtures from './fixtures/onboardingActions';

import { Action } from '@suite-types';

export const getInitialState = (custom?: any): { onboarding: OnboardingState } => {
    return {
        onboarding: {
            ...onboardingReducer(undefined, {} as Action),
            reducerEnabled: true,
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
    fixtures.forEach(f => {
        it(f.description, () => {
            const store = mockStore(getInitialState(f.initialState));
            store.dispatch(f.action());
            const stateAfter = store.getState().onboarding;
            if (f.expect.toMatchObject) {
                expect(stateAfter).toMatchObject(f.expect.toMatchObject);
            }
        });
    });
});
