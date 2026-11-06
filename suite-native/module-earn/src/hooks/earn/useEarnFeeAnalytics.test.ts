import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { type UseEarnFeeAnalyticsParams, useEarnFeeAnalytics } from './useEarnFeeAnalytics';

const initialProps: UseEarnFeeAnalyticsParams = {
    contextKey: 'private-account-context',
    flow: 'stake',
    networkSymbol: asNetworkSymbol('eth'),
    isEnabled: true,
    hasEstimationError: false,
    isFeeUnavailable: false,
    isReady: false,
    retry: mock<() => void>(),
};

describe('Earn fee analytics', () => {
    it('reports another failure after an unsuccessful retry and starts a new episode after recovery', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const { result, rerender } = await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true },
            services,
        });

        await act(() => result.current());
        await rerender(initialProps);
        await rerender({ ...initialProps, hasEstimationError: true });
        await rerender({ ...initialProps, isReady: true });
        await rerender({ ...initialProps, isFeeUnavailable: true });

        expect(jest.mocked(services.analytics.report).mock.calls.map(([event]) => event)).toEqual(
            [
                'fee-estimation-error-banner',
                'fee-estimation-retry',
                'fee-estimation-error-banner',
                'fee-estimation-recovered',
                'fee-unavailable-banner',
            ].map(element => ({
                type: 'yield/interaction',
                payload: { element, value: 'stake', networkSymbol: 'eth' },
            })),
        );
    });

    it('does not report hidden fees and still calls the retry handler', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const retry = mock<() => void>();
        const { result } = await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, isEnabled: false, hasEstimationError: true, retry },
            services,
        });

        await act(() => result.current());

        expect(services.analytics.report).not.toHaveBeenCalled();
        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('reports the visible estimation error ahead of stale unavailable levels', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const { analytics } = services;
        await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true, isFeeUnavailable: true },
            services,
        });
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'fee-estimation-error-banner',
                value: 'stake',
                networkSymbol: 'eth',
            },
        });
    });

    it('reports one failure per episode, explicit retries and only a usable recovery', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const { analytics } = services;
        const { result, rerender } = await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps,
            services,
        });
        await rerender({ ...initialProps, isReady: true });
        expect(analytics.report).not.toHaveBeenCalled();
        await rerender({ ...initialProps, hasEstimationError: true });
        await rerender({ ...initialProps, hasEstimationError: false });
        await rerender({ ...initialProps, hasEstimationError: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
        await act(() => result.current());
        await rerender(initialProps);
        expect(analytics.report).toHaveBeenCalledTimes(2);
        await rerender({ ...initialProps, isReady: true });
        expect(analytics.report).toHaveBeenCalledTimes(3);
    });

    it('does not count a transient invalid amount or blur as a new failure episode', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const { analytics } = services;
        const { rerender } = await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true },
            services,
        });
        await rerender({ ...initialProps, isEnabled: false });
        await rerender({ ...initialProps, hasEstimationError: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('resets the episode for a different account or disabled form without false recovery', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const { analytics } = services;
        const { rerender } = await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true },
            services,
        });
        await rerender({ ...initialProps, contextKey: 'another-private-account', isReady: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
        await rerender({ ...initialProps, isEnabled: false, hasEstimationError: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('uses the existing interaction event without private context or numeric fees', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        await renderHookWithBasicProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, flow: 'wrap', isFeeUnavailable: true },
            services,
        });
        expect(jest.mocked(services.analytics.report).mock.calls.map(([event]) => event)).toEqual([
            {
                type: 'yield/interaction',
                payload: { element: 'fee-unavailable-banner', value: 'wrap', networkSymbol: 'eth' },
            },
        ]);
    });
});
