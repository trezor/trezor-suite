import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useStakingNavigateAnalytics } from './useStakingNavigateAnalytics';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    availableBalance: '1000000000000000000',
});

const preloadedState = {
    wallet: { accounts: [account] },
    earn: {
        staking: mockStakingState({
            platform: 'mobile',
            descriptors: [mockStakingProductDescriptor()],
        }),
    },
};

const renderStakingNavigateAnalytics = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    const { result } = await renderHookWithStoreProvider(useStakingNavigateAnalytics, {
        services,
        preloadedState,
    });

    return { result, analytics: services.analytics };
};

describe('staking entry attribution', () => {
    it.each(['account/navigation', 'enable-network-sheet'] as const)(
        'preserves %s instead of attributing the visit to the Earn dashboard',
        async from => {
            const { result, analytics } = await renderStakingNavigateAnalytics();

            await act(() => result.current(account, from));

            expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual([
                {
                    type: 'staking/navigate',
                    payload: { action: 'navigate', from, networkSymbol: 'eth' },
                },
            ]);
        },
    );

    it('attributes a dashboard visit to the staking state of the account', async () => {
        const { result, analytics } = await renderStakingNavigateAnalytics();

        await act(() => result.current(account));

        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual([
            {
                type: 'staking/navigate',
                payload: {
                    action: 'navigate',
                    from: 'dashboard/staking-dashboard/staking-inactive',
                    networkSymbol: 'eth',
                },
            },
        ]);
    });
});
