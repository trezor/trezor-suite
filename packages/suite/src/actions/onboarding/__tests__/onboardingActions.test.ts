// TODO move this into @suite/onboarding (after suite.settings refactor)

import { type UnknownAction } from '@reduxjs/toolkit';

import { onboardingReducer } from '@suite/onboarding';
import { recoveryReducer } from '@suite/recovery';
import { suiteSettingsInitialState } from '@suite/settings';

import suiteReducer from 'src/reducers/suite/suiteReducer';
import { configureStore } from 'src/support/tests/configureStore';

import fixtures from '../__fixtures__/onboardingActions';

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
            ...onboardingReducer(undefined, { type: 'init' } as UnknownAction),
            isActive: true,
            ...onboarding,
            recovery: {
                ...recoveryReducer(undefined, { type: 'foo' } as any),
            },
        },
        suite: {
            ...suiteReducer(undefined, { type: 'init' } as any),
            ...suite,
        },
        suiteSettings: suiteSettingsInitialState,
        device: device ?? {},
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureStore<ReturnType<typeof getInitialState>, any>()(initialState);

    return store;
};

describe('Onboarding Actions', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const initialState = getInitialState(f.initialState);
            const store = createStore(initialState);
            store.dispatch(f.action());
            let { onboarding } = initialState;
            const { getActions } = store;
            for (const action of getActions()) {
                onboarding = onboardingReducer(onboarding, action as UnknownAction);
            }
            if (f.expect.toMatchObject) {
                expect(onboarding).toMatchObject(f.expect.toMatchObject);
            }
        });
    });
});
