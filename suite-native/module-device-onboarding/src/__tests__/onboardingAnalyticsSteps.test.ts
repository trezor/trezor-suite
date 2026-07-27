import { DeviceOnboardingStackRoutes } from '@suite-native/navigation';

import {
    getDeviceOnboardingAnalyticsStepIndex,
    screenToAnalyticsStepMap,
} from '../onboardingAnalyticsSteps';

describe('onboardingAnalyticsSteps', () => {
    it('maps every device-onboarding route (exhaustiveness guard)', () => {
        const mappedRoutes = Object.keys(screenToAnalyticsStepMap);

        Object.values(DeviceOnboardingStackRoutes).forEach(route => {
            expect(mappedRoutes).toContain(route);
        });
    });

    it('marks interstitial and off-happy-path screens as non-steps', () => {
        expect(screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.DeviceDisconnected]).toBeNull();
        expect(screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.SuspiciousDevice]).toBeNull();
        expect(screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.ThpPairingSuccess]).toBeNull();
        expect(
            screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess],
        ).toBeNull();
        expect(
            screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.CreateWalletLoading],
        ).toBeNull();
        expect(
            screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.WalletCreatedSuccess],
        ).toBeNull();
    });

    it('collapses multiple screens onto a single canonical step', () => {
        expect(screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.FirmwareInfo]).toBe('firmware');
        expect(screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate]).toBe(
            'firmware',
        );
        expect(screenToAnalyticsStepMap[DeviceOnboardingStackRoutes.FirmwareInstallation]).toBe(
            'firmware',
        );
    });

    it('returns stable 1-based indices per canonical step', () => {
        expect(getDeviceOnboardingAnalyticsStepIndex('security-check')).toBe(1);
        expect(getDeviceOnboardingAnalyticsStepIndex('firmware')).toBe(2);
        expect(getDeviceOnboardingAnalyticsStepIndex('final')).toBe(11);
    });

    it('gives the mutually-exclusive create/recover branch adjacent indices', () => {
        expect(getDeviceOnboardingAnalyticsStepIndex('recovery')).toBe(
            getDeviceOnboardingAnalyticsStepIndex('backup-type') + 1,
        );
    });
});
