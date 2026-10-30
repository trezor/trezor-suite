import { type NetworksDep } from '@suite-common/networks';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldListItem } from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { YieldPositionCard } from './YieldPositionCard';

const mockNavigateToYieldDetail = jest.fn();

jest.mock('../../hooks/yield/useYieldDetailNavigation', () => ({
    useYieldDetailNavigation: () => ({ navigateToYieldDetail: mockNavigateToYieldDetail }),
}));

describe('YieldPositionCard analytics', () => {
    it('identifies the selected vault when opening its active position', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
        const underlyingTokenContract = toTokenAddress(
            '0x0000000000000000000000000000000000000001',
        );
        const receiptTokenContract = toTokenAddress('0x0000000000000000000000000000000000000002');
        const item: YieldListItem = {
            id: 'position',
            yieldId: 'test-vault',
            vaultName: 'Test vault',
            tokenSymbol: toTokenSymbol('USDT'),
            networkSymbol: account.symbol,
            underlyingTokenContract,
            receiptTokenContract,
            contractAddress: receiptTokenContract,
            tokenContractAddress: underlyingTokenContract,
            apy: null,
            accountKey: account.key,
            tokenBalance: '1',
        };
        const services: NativeAnalyticsDep & NetworksDep = {
            analytics: mockNativeAnalytics(),
            networks: mockNetworksServices(),
        };
        const onClose = jest.fn();
        const view = await renderWithStoreProvider(
            <YieldPositionCard item={item} onClose={onClose} />,
            { services, preloadedState: { wallet: { accounts: [account] } } },
        );

        await fireEvent.press(view.getByText('Test vault'));

        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'vault-detail',
                networkSymbol: 'eth',
                vaultId: item.yieldId,
            },
        });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockNavigateToYieldDetail).toHaveBeenCalledWith({
            accountKey: account.key,
            tokenContract: receiptTokenContract,
        });
    });
});
