import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenInfoBranded, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountsListRow } from './AccountsListRow';

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

describe('AccountsListRow', () => {
    it('shows the token balance once the list is about a token', async () => {
        const { getByText } = await renderWithStoreProvider(
            <AccountsListRow
                accountKey={mockAccount.key}
                isFirst
                isLast
                hasBottomSpacing={false}
                tokenContract={mockToken.contract}
                onSelectAccount={jest.fn()}
            />,
            { preloadedState: { wallet: { accounts: [mockAccount] }, tokenDefinitions: {} } },
        );

        expect(getByText('23.91 USDC')).toBeOnTheScreen();
    });
});
