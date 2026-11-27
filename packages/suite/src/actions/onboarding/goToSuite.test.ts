import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type RouterPath, type SuiteRouterHistoryDep, routerReducer } from '@suite/router';
import { createRouterStateMockForRoute } from '@suite/router/mocks';
import { deviceInitialState } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type StartDiscoveryThunkDeps,
    accountsInitialState,
    blockchainInitialState,
    discoveryInitialState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { asGetter } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import {
    type GoToSuiteThunkState,
    goToSuiteThunk,
} from '#src/actions/onboarding/onboardingActions';
import onboardingReducer from '#src/reducers/onboarding/onboardingReducer';

const device = mockSuiteDevice();

type GoToSuiteTestDeps = StartDiscoveryThunkDeps &
    WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep>;

const getInitialState = (): GoToSuiteThunkState => {
    const action = { type: 'test-init' };

    return {
        locks: locksInitialState,
        modal: modalReducer(undefined, action),
        router: createRouterStateMockForRoute('onboarding-index'),
        networks: mockNetworksState([asNetworkSymbol('btc')]),
        persistentDeviceData: persistentDeviceDataInitialState,
        tokenDefinitions: tokenDefinitionsInitialState,
        wallet: {
            accounts: accountsInitialState,
            blockchain: blockchainInitialState,
            settings: { ...initialWalletSettingsState, enabledNetworks: [asNetworkSymbol('btc')] },
            discovery: discoveryInitialState,
        },
        onboarding: {
            ...onboardingReducer(undefined, action),
            isActive: true,
            activeStepId: 'final',
            path: ['create'],
            onboardingAnalytics: { startTime: Date.now(), seed: 'create' },
        },
        device: { ...deviceInitialState, selectedDevice: device },
    };
};

const setup = (backgroundPath: RouterPath['pathname'] = '/') => {
    const report = jest.fn();
    const navigate = jest.fn();
    const initialState = getInitialState();

    const { store } = createTestCompositionRoot<GoToSuiteTestDeps, GoToSuiteThunkState>({
        extra: {
            thunks: {
                fetchAndSaveMetadata: jest.fn(() => () => undefined),
            },
        },
        preloadedState: initialState,
        reducer: (state = initialState, action) => ({
            ...state,
            router: routerReducer(state.router, action),
            locks: locksReducer(state.locks, action),
            modal: modalReducer(state.modal, action),
            onboarding: onboardingReducer(state.onboarding, action),
        }),
        services: () => ({
            analytics: mockDesktopAnalytics(report),
            getTradedAccountKeys: asGetter(() => []),
            suiteRouterHistory: {
                getLocation: () => ({ pathname: backgroundPath, hash: '', search: '' }),
                navigate,
                listen: jest.fn(() => jest.fn()),
            },
        }),
    }).services;

    return { store, report, navigate };
};

describe('goToSuiteThunk', () => {
    it.each(['/', '/settings', '/settings/device'] as const)(
        'finishes on the dashboard with %s in the background',
        backgroundPath => {
            const { store, navigate } = setup(backgroundPath);

            store.dispatch(goToSuiteThunk());

            expect(store.getState().router.route?.name).toBe('suite-index');
            expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/' }));
            expect(store.getState().onboarding.isActive).toBe(false);
        },
    );

    it('reports device-setup-completed by default', () => {
        const { store, report } = setup();

        store.dispatch(goToSuiteThunk());

        expect(report).toHaveBeenCalledTimes(1);
        expect(report.mock.calls[0][0].type).toBe('device-setup-completed');
    });

    it('does not report device-setup-completed when the event is skipped', () => {
        const { store, report } = setup();

        store.dispatch(goToSuiteThunk({ skipDeviceSetupCompletedEvent: true }));

        expect(report).not.toHaveBeenCalled();
    });
});
