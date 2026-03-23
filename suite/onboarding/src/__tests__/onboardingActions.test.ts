import { type UnknownAction } from '@reduxjs/toolkit';

import { prepareSuiteSettingsReducer, suiteSettingsInitialState } from '@suite/settings';
import { prepareDeviceReducer } from '@suite-common/device';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import fixtures from '../__fixtures__/onboardingActions';
import { onboardingReducer } from '../onboardingReducer';

const settingsReducer = prepareSuiteSettingsReducer(extraDependenciesCommonMock);
const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);

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
                    suiteSettings: settingsReducer,
                    device: deviceReducer,
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
