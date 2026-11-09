import { toTokenAddress } from '@suite-common/tokens';
import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { YieldVaultBanner } from './YieldVaultBanner';

const mockFlow = mockResolvedYieldFlowData();
const mockNavigate = mock<(...args: unknown[]) => void>();
jest.mock('@suite-native/module-earn', () => ({
    ...jest.requireActual('@suite-native/module-earn'),
    useYieldFlowData: () => mockFlow,
    useYieldDetailNavigation: () => ({ navigateToYieldDetail: mockNavigate }),
}));

it('attributes Manage position to the account banner without reporting account identifiers', async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    const view = await renderWithStoreProvider(
        <YieldVaultBanner
            accountKey={mockFlow.account.key}
            tokenContract={toTokenAddress('0x0000000000000000000000000000000000000001')}
        />,
        { services },
    );
    await fireEvent.press(
        view.getByText(
            getTranslation('moduleAccounts.accountDetail.stablecoinYield.managePosition'),
        ),
    );

    expect(jest.mocked(services.analytics.report).mock.calls.map(([event]) => event)).toEqual([
        {
            type: 'yield/navigate',
            payload: {
                action: 'continue',
                from: 'account-banner',
                to: 'vault-detail',
                networkSymbol: 'eth',
                vaultId: mockFlow.vault.id,
            },
        },
    ]);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
});
