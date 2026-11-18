import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { YieldBadge } from './YieldBadge';

const mockNavigate = mock<(...args: unknown[]) => void>();
const mockPopTo = mock<(...args: unknown[]) => void>();
const mockVault = mockYieldVault();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate, popTo: mockPopTo }),
}));
jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useYieldOpportunity: (vaultId: string) => ({ data: vaultId ? mockVault : undefined }),
}));

describe('Yield token detail badge entry analytics', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        { variant: 'active', vaultId: mockVault.id },
        { variant: 'inactive', vaultId: mockVault.id },
        { variant: 'promo', vaultId: mockVault.id },
        { variant: 'promo', vaultId: '' },
    ] as const)(
        'reports the $variant badge destination (vaultId=$vaultId)',
        async ({ variant, vaultId }) => {
            const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            const view = await renderWithBasicProvider(
                <YieldBadge account={account} vaultId={vaultId} apy={5} variant={variant} />,
                { services },
            );
            await fireEvent.press(view.getByTestId('@earn/yield-badge'));

            expect(
                jest.mocked(services.analytics.report).mock.calls.map(([event]) => event),
            ).toEqual([
                {
                    type: 'yield/navigate',
                    payload: {
                        action: 'continue',
                        from: 'account-detail',
                        to: variant === 'promo' ? 'earn-dashboard' : 'vault-detail',
                        networkSymbol: 'eth',
                        ...(variant !== 'promo' && { vaultId }),
                    },
                },
            ]);
            expect(variant === 'promo' ? mockPopTo : mockNavigate).toHaveBeenCalledTimes(1);
        },
    );
});
