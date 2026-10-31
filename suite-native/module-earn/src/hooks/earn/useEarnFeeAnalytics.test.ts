import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { type EarnFeeFlow, useEarnFeeAnalytics } from './useEarnFeeAnalytics';

const initialProps = {
    contextKey: 'private-account-context',
    flow: 'stake' as EarnFeeFlow,
    networkSymbol: asNetworkSymbol('eth'),
    isEnabled: true,
    hasEstimationError: false,
    isFeeUnavailable: false,
    isReady: false,
    retry: jest.fn(),
};

describe('Earn fee analytics', () => {
    it('reports the visible estimation error ahead of stale unavailable levels', async () => {
        const analytics = mockNativeAnalytics();
        await renderHookWithStoreProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true, isFeeUnavailable: true },
            services: { analytics },
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
        const analytics = mockNativeAnalytics();
        const { result, rerender } = await renderHookWithStoreProvider(useEarnFeeAnalytics, {
            initialProps,
            services: { analytics },
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
        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual(
            ['fee-estimation-error-banner', 'fee-estimation-retry', 'fee-estimation-recovered'].map(
                element => ({
                    type: events.yieldInteractionEvent.name,
                    payload: {
                        element,
                        value: 'stake',
                        networkSymbol: 'eth',
                    },
                }),
            ),
        );
    });

    it('does not count a transient invalid amount or blur as a new failure episode', async () => {
        const analytics = mockNativeAnalytics();
        const { rerender } = await renderHookWithStoreProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true },
            services: { analytics },
        });
        await rerender({ ...initialProps, isEnabled: false });
        await rerender({ ...initialProps, hasEstimationError: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('resets the episode for a different account or disabled form without false recovery', async () => {
        const analytics = mockNativeAnalytics();
        const { rerender } = await renderHookWithStoreProvider(useEarnFeeAnalytics, {
            initialProps: { ...initialProps, hasEstimationError: true },
            services: { analytics },
        });
        await rerender({ ...initialProps, contextKey: 'another-private-account', isReady: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
        await rerender({ ...initialProps, isEnabled: false, hasEstimationError: true });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });
});

it.each([
    'stake',
    'unstake',
    'claim',
    'approve',
    'revoke',
    'merkl-claim',
    'yield-deposit',
    'yield-withdraw',
    'yield-redeem',
    'withdraw',
    'wrap',
    'unwrap',
] as const)(
    'uses the existing interaction event for %s without private context or numeric fees',
    async flow => {
        const analytics = mockNativeAnalytics();
        await renderHookWithStoreProvider(useEarnFeeAnalytics, {
            initialProps: {
                ...initialProps,
                flow,
                isFeeUnavailable: true,
            },
            services: { analytics },
        });
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: { element: 'fee-unavailable-banner', value: flow, networkSymbol: 'eth' },
        });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    },
);
