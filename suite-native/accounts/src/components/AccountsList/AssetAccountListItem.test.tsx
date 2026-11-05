import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type TokenInfoBranded,
    type TokenSymbol,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AssetAccountListItem } from './AssetAccountListItem';

const mockToken: TokenInfoBranded = {
    name: 'USD Coin',
    symbol: toTokenSymbol('USDC'),
    contract: toTokenAddress('0x' + '1'.repeat(40)),
    standard: 'ERC20',
    decimals: 6,
    balance: '23.910287',
};

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

const renderAssetAccountListItem = (account: Account, tokenSymbol?: TokenSymbol) =>
    renderWithStoreProvider(
        <AssetAccountListItem
            account={account}
            contractAddress={mockToken.contract}
            tokenSymbol={tokenSymbol}
            onPress={jest.fn()}
        />,
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

        const { getByText } = await renderAssetAccountListItem(account, toTokenSymbol('USDC'));

        expect(getByText('0 USDC')).toBeOnTheScreen();
    });
});
