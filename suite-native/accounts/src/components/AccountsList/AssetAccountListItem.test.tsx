import { TokenMetadataProvider } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AssetAccountListItem } from './AssetAccountListItem';

const mockToken = mockAccountToken({ symbol: 'USDC', decimals: 6, balance: '23.910287' });

jest.mock('@suite-native/icons', () => ({
    Icon: () => null,
    TokenIcon: () => null,
}));

jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    TokenToFiatAmountFormatter: () => null,
}));

jest.mock('../AccountLabel', () => ({
    AccountLabel: () => null,
}));

const renderAssetAccountListItem = (account: Account) =>
    renderWithStoreProvider(
        <TokenMetadataProvider
            sources={[
                {
                    networkSymbol: account.symbol,
                    tokens: [{ ...mockToken, contract: toTokenAddress(mockToken.contract) }],
                },
            ]}
        >
            <AssetAccountListItem
                account={account}
                contractAddress={toTokenAddress(mockToken.contract)}
                onPress={jest.fn()}
            />
        </TokenMetadataProvider>,
        { preloadedState: { wallet: { accounts: [account] }, tokenDefinitions: {} } },
    );

describe('AssetAccountListItem', () => {
    it('shows the balance of a token the account holds', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth'), tokens: [mockToken] });

        const { getByText } = await renderAssetAccountListItem(account);

        expect(getByText('23.91 USDC')).toBeOnTheScreen();
    });

    it('shows zero with the given symbol for a token the account does not hold', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth'), tokens: [] });

        const { getByText } = await renderAssetAccountListItem(account);

        expect(getByText('0 USDC')).toBeOnTheScreen();
    });
});
