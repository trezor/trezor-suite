import { configureStore } from 'src/support/tests/configureStore';

import onboardingReducer from 'src/reducers/onboarding/onboardingReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import recoveryReducer from 'src/reducers/recovery/recoveryReducer';
import fixtures from '../__fixtures__/onboardingActions';

import { Action } from 'src/types/suite';

// todo fighting with typescript here. How to keep string literal being exported from fixtures and not converted
// to string? if exported as const, it makes all properties readonly and thus not assignable to reducer which
// expects mutable properties;

// type OnboardingState = Partial<ReturnType<typeof onboardingReducer>>;
// type SuiteState = Partial<ReturnType<typeof suiteReducer>>;
// interface State {
//     onboarding?: OnboardingState;
//     suite?: SuiteState;
// }

export const getInitialState = (custom?: any) => {
    const suite = custom ? custom.suite : undefined;
    const onboarding = custom ? custom.onboarding : undefined;

    return {
        onboarding: {
            ...onboardingReducer(undefined, {} as Action),
            isActive: true,
            ...onboarding,
            recovery: {
                ...recoveryReducer(undefined, { type: 'foo' } as any),
            },
        },
        suite: {
            ...suiteReducer(undefined, {} as Action),
            ...suite,
        },
        device: {},
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureStore<ReturnType<typeof getInitialState>, any>()(initialState);

    return store;
};

const updateStore = (store: ReturnType<typeof createStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { onboarding } = store.getState();

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
