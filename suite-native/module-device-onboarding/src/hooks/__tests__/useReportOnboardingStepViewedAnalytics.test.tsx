import { ServicesProvider, createMockDeps } from '@suite-common/dependency-injection';
import { DeviceOnboardingStackRoutes } from '@suite-native/navigation';
import { act, renderHook } from '@suite-native/test-utils-store';
import { type Analytics } from '@trezor/analytics-uploader';

import { useReportOnboardingStepViewedAnalytics } from '../useReportOnboardingStepViewedAnalytics';

// `Analytics` is an interface; map it to a type alias so it satisfies the
// index-signature constraint of createMockDeps' `RecursiveDeps`.
type AnalyticsService = { [K in keyof Analytics<any>]: Analytics<any>[K] };

// Only `report` is expected to be called; every other Analytics method is left
// unmocked (null), so createMockDeps makes it throw if the hook touches it.
const renderUseReportStepViewed = () => {
    const analytics = createMockDeps<AnalyticsService>({
        report: jest.fn(),
        init: null,
        enable: null,
        disable: null,
        isEnabled: () => true,
        setUrl: null,
        setLoggerEnabled: null,
    });

    const view = renderHook(() => useReportOnboardingStepViewedAnalytics(), {
        wrapper: ({ children }) => (
            <ServicesProvider services={{ analytics }}>{children}</ServicesProvider>
        ),
    });

    return { ...view, analytics };
};

describe('useReportOnboardingStepViewedAnalytics', () => {
    it('reports a step once on entry with mobile platform and per-platform index', () => {
        const { result, analytics } = renderUseReportStepViewed();

        act(() => {
            result.current(DeviceOnboardingStackRoutes.FirmwareInfo);
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'onboarding/step-viewed',
            payload: { stepName: 'firmware', stepIndex: 2, platform: 'mobile' },
        });
    });

    it('does not re-report while moving across screens of the same canonical step', () => {
        const { result, analytics } = renderUseReportStepViewed();

        act(() => {
            result.current(DeviceOnboardingStackRoutes.FirmwareInfo);
            result.current(DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate);
            result.current(DeviceOnboardingStackRoutes.FirmwareInstallation);
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports again when the canonical step changes', () => {
        const { result, analytics } = renderUseReportStepViewed();

        act(() => {
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

    it('does not report for non-step (skipped) screens', () => {
        const { result, analytics } = renderUseReportStepViewed();

        act(() => {
            result.current(DeviceOnboardingStackRoutes.CreateWalletLoading);
            result.current(DeviceOnboardingStackRoutes.WalletCreatedSuccess);
        });

        expect(analytics.report).not.toHaveBeenCalled();
    });
});
