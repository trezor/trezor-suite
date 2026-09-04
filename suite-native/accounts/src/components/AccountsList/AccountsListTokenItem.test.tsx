import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenInfoBranded, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { Text } from '@suite-native/atoms';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountsListTokenItem } from './AccountsListTokenItem';

const mockToken: TokenInfoBranded = {
    name: 'USD Coin',
    symbol: toTokenSymbol('USDC'),
    contract: toTokenAddress('0x' + '1'.repeat(40)),
    standard: 'ERC20',
    decimals: 6,
    balance: '23.910287',
};

const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth'), tokens: [mockToken] });

jest.mock('@suite-native/icons', () => ({
    TokenIcon: () => null,
}));

jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    TokenToFiatAmountFormatter: () => <Text>US$23.91</Text>,
}));

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('AccountsListTokenItem', () => {
    const renderAccountsListTokenItem = async ({
        showFiatValue,
    }: {
        showFiatValue?: boolean;
    } = {}) =>
        await renderWithStoreProvider(
            <AccountsListTokenItem
                token={mockToken}
                account={mockAccount}
                showFiatValue={showFiatValue}
                onSelectAccount={jest.fn()}
            />,
            {
                preloadedState: { wallet: { accounts: [mockAccount] } },
            },
        );

    it('renders 6-decimal token balance with compact balance formatting next to fiat value', async () => {
        const { getByText, queryByText } = await renderAccountsListTokenItem();

        expect(getByText('23.91 USDC')).toBeOnTheScreen();
        expect(queryByText('23.910287 USDC')).toBeNull();
    });

    it('renders 6-decimal token balance compact even when fiat value is hidden', async () => {
        const { getByText, queryByText } = await renderAccountsListTokenItem({
            showFiatValue: false,
        });

        expect(getByText('23.91 USDC')).toBeOnTheScreen();
        expect(queryByText('23.910287 USDC')).toBeNull();
    });
});
