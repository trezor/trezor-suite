import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { locksInitialState } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type SuiteRouterHistoryDep, routerReducer } from '@suite/router';
import { suiteSettingsInitialState } from '@suite/settings';
import { asGetter } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { type WithServices } from '@suite-common/redux-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import { type StartDiscoveryThunkDeps } from '@suite-common/wallet-core';

import { type GoToNextStepThunkState } from 'src/actions/onboarding/onboardingActions';
import onboardingReducer from 'src/reducers/onboarding/onboardingReducer';
import { walletReducers } from 'src/reducers/wallet';

import { type OnboardingActionsFixture, fixtures } from './__fixtures__/onboardingActions';

type OnboardingActionsTestDeps = StartDiscoveryThunkDeps &
    WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep>;

const getInitialState = (
    custom?: OnboardingActionsFixture['initialState'],
): GoToNextStepThunkState => {
    const action = { type: 'test-init' };
    const onboarding = onboardingReducer(undefined, action);

    return {
        locks: locksInitialState,
        modal: modalReducer(undefined, action),
        router: routerReducer(undefined, action),
        suiteSettings: suiteSettingsInitialState,
        networks: mockNetworksState(mockGetSupportedNetworks()),
        persistentDeviceData: persistentDeviceDataInitialState,
        tokenDefinitions: tokenDefinitionsInitialState,
        wallet: walletReducers(undefined, action),
        onboarding: {
            ...onboarding,
            isActive: true,
            ...custom?.onboarding,
        },
        device: { ...deviceInitialState, ...custom?.device },
    };
};

const createStore = (initialState: GoToNextStepThunkState) =>
    createTestCompositionRoot<OnboardingActionsTestDeps, GoToNextStepThunkState>({
        extra: {
            thunks: {
                fetchAndSaveMetadata: jest.fn(() => () => undefined),
            },
        },
        reducer: (state = initialState, action) => ({
            ...state,
            onboarding: onboardingReducer(state.onboarding, action),
        }),
        preloadedState: initialState,
        services: () => ({
            analytics: mockDesktopAnalytics(),
            getTradedAccountKeys: asGetter(() => []),
            suiteRouterHistory: {
                getLocation: jest.fn(),
                navigate: jest.fn(),
                listen: jest.fn(() => jest.fn()),
            },
        }),
    }).services.store;

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
