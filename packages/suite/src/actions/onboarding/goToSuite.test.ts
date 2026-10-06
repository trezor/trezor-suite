import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { locksInitialState } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type SuiteRouterHistoryDep, routerReducer } from '@suite/router';
import { asGetter } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { type WithServices } from '@suite-common/redux-utils';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type StartDiscoveryThunkDeps } from '@suite-common/wallet-core';

import { type GoToSuiteThunkState, goToSuiteThunk } from 'src/actions/onboarding/onboardingActions';
import onboardingReducer from 'src/reducers/onboarding/onboardingReducer';
import { walletReducers } from 'src/reducers/wallet';

const device = mockSuiteDevice();

type GoToSuiteTestDeps = StartDiscoveryThunkDeps &
    WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep>;

const getInitialState = (): GoToSuiteThunkState => {
    const action = { type: 'test-init' };
    const wallet = walletReducers(undefined, action);

    return {
        locks: locksInitialState,
        modal: modalReducer(undefined, action),
        router: routerReducer(undefined, action),
        networks: mockNetworksState([asNetworkSymbol('btc')]),
        persistentDeviceData: persistentDeviceDataInitialState,
        tokenDefinitions: tokenDefinitionsInitialState,
        wallet: {
            ...wallet,
            settings: { ...wallet.settings, enabledNetworks: [asNetworkSymbol('btc')] },
        },
        onboarding: {
            ...onboardingReducer(undefined, action),
            path: ['create'],
            onboardingAnalytics: { startTime: Date.now(), seed: 'create' },
        },
        device: { ...deviceInitialState, selectedDevice: device },
    };
};

const setup = () => {
    const report = jest.fn();

    const { store } = createTestCompositionRoot<GoToSuiteTestDeps, GoToSuiteThunkState>({
        extra: {
            thunks: {
                fetchAndSaveMetadata: jest.fn(() => () => undefined),
            },
        },
        preloadedState: getInitialState(),
        services: () => ({
            analytics: mockDesktopAnalytics(report),
            getTradedAccountKeys: asGetter(() => []),
            suiteRouterHistory: {
                getLocation: jest.fn(),
                navigate: jest.fn(),
                listen: jest.fn(() => jest.fn()),
            },
        }),
    }).services;

    return { store, report };
};

describe('goToSuiteThunk', () => {
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
