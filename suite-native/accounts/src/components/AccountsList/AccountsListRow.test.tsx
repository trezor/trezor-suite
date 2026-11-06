import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountsListRow } from './AccountsListRow';

const mockToken = mockAccountToken({ symbol: 'USDC', decimals: 6, balance: '23.910287' });

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
                tokenContract={toTokenAddress(mockToken.contract)}
                onSelectAccount={jest.fn()}
            />,
            { preloadedState: { wallet: { accounts: [mockAccount] }, tokenDefinitions: {} } },
        );

        expect(getByText('23.91 USDC')).toBeOnTheScreen();
    });
});
