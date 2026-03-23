import { type UnknownAction } from '@reduxjs/toolkit';

import { onboardingReducer } from '@suite/onboarding';
import { suiteSettingsInitialState } from '@suite/settings';
import { configureMockStore } from '@suite-common/test-utils';

import fixtures from '../__fixtures__/onboardingActions';

const getInitialState = (custom?: any) => {
    const onboarding = custom ? custom.onboarding : undefined;
    const device = custom ? custom.device : undefined;

    return {
        onboarding: {
            ...onboardingReducer(undefined, { type: 'init' } as UnknownAction),
            isActive: true,
            ...onboarding,
        },
        suiteSettings: suiteSettingsInitialState,
        device: device ?? {},
    };
};

describe('Onboarding Actions', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const store = configureMockStore({
                reducer: {
                    onboarding: onboardingReducer,
                    suiteSettings: (state = suiteSettingsInitialState) => state,
                    device: (state = {}) => state,
                },
                preloadedState: getInitialState(f.initialState),
            });
            store.dispatch(f.action());
            if (f.expect.toMatchObject) {
                expect(store.getState().onboarding).toMatchObject(f.expect.toMatchObject);
            }
        });
    });
});
