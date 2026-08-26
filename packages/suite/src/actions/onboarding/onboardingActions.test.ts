import { debugInitialState } from '@suite/debug';
import { recoveryReducer } from '@suite/recovery';
import { suiteSettingsInitialState } from '@suite/settings';
import { configureMockStore } from '@suite-common/test-utils';

import onboardingReducer from 'src/reducers/onboarding/onboardingReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';

import fixtures from './__fixtures__/onboardingActions';

// todo fighting with typescript here. How to keep string literal being exported from fixtures and not converted
// to string? if exported as const, it makes all properties readonly and thus not assignable to reducer which
// expects mutable properties;

// type OnboardingState = Partial<ReturnType<typeof onboardingReducer>>;
// type SuiteState = Partial<ReturnType<typeof suiteReducer>>;
// interface State {
//     onboarding?: OnboardingState;
//     suite?: SuiteState;
// }

const getInitialState = (custom?: any) => {
    const suite = custom ? custom.suite : undefined;
    const onboarding = custom ? custom.onboarding : undefined;
    const device = custom ? custom.device : undefined;

    return {
        onboarding: {
            ...onboardingReducer(undefined, { type: 'test-init' }),
            isActive: true,
            ...onboarding,
            recovery: {
                ...recoveryReducer(undefined, { type: 'foo' } as any),
            },
        },
        suite: {
            ...suiteReducer(undefined, { type: 'test-init' }),
            ...suite,
        },
        suiteSettings: suiteSettingsInitialState,
        debug: debugInitialState,
        device: device ?? {},
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureMockStore({
        reducer: (state = initialState, action) => ({
            ...state,
            onboarding: onboardingReducer(state.onboarding, action),
        }),
        preloadedState: initialState,
    });

    return store;
};

describe('Onboarding Actions', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const store = createStore(getInitialState(f.initialState));
            store.dispatch(f.action());
            const stateAfter = store.getState().onboarding;
            if (f.expect.toMatchObject) {
                expect(stateAfter).toMatchObject(f.expect.toMatchObject);
            }
        });
    });
});
