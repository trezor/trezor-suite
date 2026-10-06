import { ServicesProvider } from '@suite-common/dependency-injection';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { DeviceOnboardingStackRoutes } from '@suite-native/navigation';
import { act, renderHook } from '@suite-native/test-utils-store';

import { useReportOnboardingStepViewedAnalytics } from './useReportOnboardingStepViewedAnalytics';

const renderUseReportStepViewed = async () => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHook(() => useReportOnboardingStepViewedAnalytics(), {
        wrapper: ({ children }) => (
            <ServicesProvider services={services}>{children}</ServicesProvider>
        ),
    });

    return { ...view, analytics: services.analytics };
};

describe('useReportOnboardingStepViewedAnalytics', () => {
    it('reports a step once on entry with mobile platform and per-platform index', async () => {
        const { result, analytics } = await renderUseReportStepViewed();

        await act(() => {
            result.current(DeviceOnboardingStackRoutes.FirmwareInfo);
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'onboarding/step-viewed',
            payload: { stepName: 'firmware', stepIndex: 2, platform: 'mobile' },
        });
    });

    it('does not re-report while moving across screens of the same canonical step', async () => {
        const { result, analytics } = await renderUseReportStepViewed();

        await act(() => {
            result.current(DeviceOnboardingStackRoutes.FirmwareInfo);
            result.current(DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate);
            result.current(DeviceOnboardingStackRoutes.FirmwareInstallation);
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports again when the canonical step changes', async () => {
        const { result, analytics } = await renderUseReportStepViewed();

        await act(() => {
            result.current(DeviceOnboardingStackRoutes.FirmwareInfo);
            result.current(DeviceOnboardingStackRoutes.DeviceTutorial);
        });

        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ stepName: 'tutorial' }),
            }),
        );
    });

    it('does not report for non-step (skipped) screens', async () => {
        const { result, analytics } = await renderUseReportStepViewed();

        await act(() => {
            result.current(DeviceOnboardingStackRoutes.CreateWalletLoading);
            result.current(DeviceOnboardingStackRoutes.WalletCreatedSuccess);
        });

        expect(analytics.report).not.toHaveBeenCalled();
    });
});
