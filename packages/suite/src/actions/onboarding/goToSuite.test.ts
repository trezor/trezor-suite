import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { type DeepPartial } from '@trezor/type-utils';

import { goToSuite } from 'src/actions/onboarding/onboardingActions';
import { type AppState } from 'src/types/suite';

const device = mockSuiteDevice();

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

    const store = configureMockStore({
        extra: { services: { analytics: mockDesktopAnalytics(report) } },
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
