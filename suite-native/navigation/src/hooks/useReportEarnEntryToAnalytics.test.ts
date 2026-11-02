import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { useReportEarnEntryToAnalytics } from './useReportEarnEntryToAnalytics';

describe('Earn entry analytics', () => {
    it.each(['ConnectingDevice', 'PinMatrix', 'PassphraseForm'])(
        'does not count returning from %s as a new Earn visit',
        async overlay => {
            const services: NativeAnalyticsDep = {
                analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
            };
            const { result } = await renderHookWithBasicProvider(useReportEarnEntryToAnalytics, {
                services,
            });

            await act(() => {
                expect(
                    result.current({ currentRouteName: 'Earn', previousRouteName: 'Home' }),
                ).toBe(true);
                expect(
                    result.current({ currentRouteName: overlay, previousRouteName: 'Earn' }),
                ).toBe(false);
                expect(
                    result.current({ currentRouteName: 'Earn', previousRouteName: overlay }),
                ).toBe(false);
            });

            expect(services.analytics.report).toHaveBeenCalledTimes(1);
        },
    );

    it('keeps one Earn visit across overlays and reports a real re-entry', async () => {
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        const { result } = await renderHookWithBasicProvider(useReportEarnEntryToAnalytics, {
            services,
        });

        await act(() => {
            result.current({ currentRouteName: 'Earn', previousRouteName: 'Home' });
            result.current({ currentRouteName: 'FeatureFeedbackModal', previousRouteName: 'Earn' });
            result.current({ currentRouteName: 'Earn', previousRouteName: 'FeatureFeedbackModal' });
        });
        expect(services.analytics.report).toHaveBeenCalledTimes(1);

        await act(() => {
            result.current({ currentRouteName: 'Home', previousRouteName: 'Earn' });
            result.current({ currentRouteName: 'Earn', previousRouteName: 'Home' });
        });
        expect(services.analytics.report).toHaveBeenCalledTimes(2);
    });

    it('reports a new entry when an overlay navigates away from Earn', async () => {
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        const { result } = await renderHookWithBasicProvider(useReportEarnEntryToAnalytics, {
            services,
        });

        await act(() => {
            expect(result.current({ currentRouteName: 'Earn', previousRouteName: 'Home' })).toBe(
                true,
            );
            expect(
                result.current({
                    currentRouteName: 'DeviceCompromisedModal',
                    previousRouteName: 'Earn',
                }),
            ).toBe(false);
            expect(
                result.current({
                    currentRouteName: 'Home',
                    previousRouteName: 'DeviceCompromisedModal',
                }),
            ).toBe(false);
            expect(result.current({ currentRouteName: 'Earn', previousRouteName: 'Home' })).toBe(
                true,
            );
        });

        expect(services.analytics.report).toHaveBeenCalledTimes(2);
        expect(services.analytics.report).toHaveBeenLastCalledWith({
            type: 'yield/earn-entry',
            payload: { from: 'Home' },
        });
    });

    it.each([undefined, 'Home', 'AccountDetail', 'YieldDepositComplete'])(
        'reports entry from %s with the same event as desktop',
        async previousRouteName => {
            const services: NativeAnalyticsDep = {
                analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
            };
            const { result } = await renderHookWithBasicProvider(useReportEarnEntryToAnalytics, {
                services,
            });

            await act(() => result.current({ currentRouteName: 'Earn', previousRouteName }));

            expect(services.analytics.report).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledWith({
                type: 'yield/earn-entry',
                payload: { from: previousRouteName ?? 'unknown' },
            });
        },
    );

    it('ignores changes within Earn and navigation to other screens', async () => {
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };
        const { result } = await renderHookWithBasicProvider(useReportEarnEntryToAnalytics, {
            services,
        });

        await act(() => {
            result.current({ currentRouteName: 'Earn', previousRouteName: 'Earn' });
            result.current({ currentRouteName: 'Home', previousRouteName: 'Earn' });
            result.current({ currentRouteName: undefined });
        });

        expect(services.analytics.report).not.toHaveBeenCalled();
    });
});
