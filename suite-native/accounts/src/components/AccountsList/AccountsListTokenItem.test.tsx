import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenInfoBranded, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { Text } from '@suite-native/atoms';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

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

type RenderAccountsListTokenItemParams = {
    showFiatValue?: boolean;
    token?: TokenInfoBranded;
    isKnown?: boolean;
    onSelectAccount?: () => void;
};

describe('AccountsListTokenItem', () => {
    const renderAccountsListTokenItem = ({
        showFiatValue,
        token = mockToken,
        isKnown = false,
        onSelectAccount = mock<() => void>(),
    }: RenderAccountsListTokenItemParams = {}) =>
        renderWithStoreProvider(
            <AccountsListTokenItem
                token={token}
                account={mockAccount}
                showFiatValue={showFiatValue}
                onSelectAccount={onSelectAccount}
            />,
            {
                preloadedState: {
                    wallet: { accounts: [mockAccount] },
                    tokenDefinitions: {
                        eth: {
                            coin: { data: isKnown ? [token.contract] : [], hide: [token.contract] },
                        },
                    },
                },
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

    it('masks an unrecognized token URL without intercepting selection', async () => {
        const onSelectAccount = mock<() => void>();
        const { getByLabelText, queryByText } = await renderAccountsListTokenItem({
            token: { ...mockToken, name: 'Claim at rewards.example now' },
            onSelectAccount,
        });

        expect(queryByText('Claim at rewards.example now')).toBeNull();
        fireEvent.press(getByLabelText('Claim at … now'));
        expect(onSelectAccount).toHaveBeenCalledTimes(1);
    });

    it('keeps a recognized token name readable even when the token is manually hidden', async () => {
        const { getByText } = await renderAccountsListTokenItem({
            token: { ...mockToken, name: 'Known rewards.example token' },
            isKnown: true,
        });

        expect(getByText('Known rewards.example token')).toBeOnTheScreen();
    });
});
