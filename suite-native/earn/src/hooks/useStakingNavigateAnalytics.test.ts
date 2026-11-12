import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useStakingNavigateAnalytics } from './useStakingNavigateAnalytics';

describe('staking entry attribution', () => {
    it.each(['account/navigation', 'enable-network-sheet'] as const)(
        'preserves %s instead of attributing the visit to the Earn dashboard',
        async from => {
            const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            const { result } = await renderHookWithBasicProvider(useStakingNavigateAnalytics, {
                services,
            });
            await act(() => result.current(account, from));

            expect(
                jest.mocked(services.analytics.report).mock.calls.map(([event]) => event),
            ).toEqual([
                {
                    type: 'staking/navigate',
                    payload: { action: 'navigate', from, networkSymbol: 'eth' },
                },
            ]);
        },
    );
});
