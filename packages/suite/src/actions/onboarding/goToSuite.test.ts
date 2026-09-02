import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type SuiteRouterHistoryDep } from '@suite/router';
import { asGetter } from '@suite-common/dependency-injection';
import { type WithServices } from '@suite-common/redux-utils';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { type StartDiscoveryThunkDeps } from '@suite-common/wallet-core';
import { type DeepPartial } from '@trezor/type-utils';

import { goToSuite } from 'src/actions/onboarding/onboardingActions';
import { type AppState } from 'src/types/suite';

const device = mockSuiteDevice();

type GoToSuiteTestDeps = StartDiscoveryThunkDeps &
    WithServices<DesktopAnalyticsDep & SuiteRouterHistoryDep>;

const createExtra = (report: jest.Mock): GoToSuiteTestDeps => ({
    services: {
        analytics: mockDesktopAnalytics(report),
        getTradedAccountKeys: asGetter(() => []),
        suiteRouterHistory: {
            getLocation: jest.fn(),
            navigate: jest.fn(),
            listen: jest.fn(() => jest.fn()),
        },
    },
    thunks: {
        fetchAndSaveMetadata: jest.fn(() => () => undefined),
    },
});

const setup = () => {
    const report = jest.fn();

    const preloadedState: DeepPartial<AppState> = {
        onboarding: {
            path: ['create'],
            onboardingAnalytics: { startTime: Date.now(), seed: 'create' },
        },
        device: { selectedDevice: device },
        wallet: { settings: { enabledNetworks: ['btc'] } },
    };

    const store = createTestStore({
        extra: createExtra(report),
        preloadedState,
    });

    return { store, report };
};

describe('goToSuite', () => {
    it('reports device-setup-completed by default', () => {
        const { store, report } = setup();

        store.dispatch(goToSuite());

        expect(report).toHaveBeenCalledTimes(1);
        expect(report.mock.calls[0][0].type).toBe('device-setup-completed');
    });

    it('does not report device-setup-completed when the event is skipped', () => {
        const { store, report } = setup();

        store.dispatch(goToSuite({ skipDeviceSetupCompletedEvent: true }));

        expect(report).not.toHaveBeenCalled();
    });
});
