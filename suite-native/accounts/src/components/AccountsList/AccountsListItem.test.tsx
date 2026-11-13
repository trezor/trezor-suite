import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockStakeRootState } from '@suite-common/wallet-core/mocks';
import { type Account, type CurrentRate, type Timestamp } from '@suite-common/wallet-types';
import { mockAccountToken, mockEthereumStakingAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountsListItem } from './AccountsListItem';

jest.mock('@suite-native/icons', () => ({
    ...jest.requireActual('@suite-native/icons'),
    Icon: () => null,
    TokenIcon: () => null,
}));

jest.mock('../AccountLabel', () => ({
    AccountLabel: () => null,
}));

const symbol = asNetworkSymbol('eth');
const contract = toTokenAddress('0x' + 'a'.repeat(40));
const ethAccount = mockEthereumStakingAccount('active', {
    tokens: [mockAccountToken({ contract, balance: '250' })],
});
const createRate = (rate: number | undefined): CurrentRate => {
    const status = {
        ticker: { symbol },
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading: false,
        error: null,
    };

    return rate === undefined ? status : { ...status, rate, usdRate: rate };
};

type RenderAccountOptions = {
    account?: Account;
    isNativeCoinOnly?: boolean;
    shouldAlwaysShowCryptoAmount?: boolean;
    shouldLimitFiatToNativeBalance?: boolean;
    nativeRate?: CurrentRate | null;
    hiddenTokens?: string[];
};

const renderAccount = ({
    account = ethAccount,
    isNativeCoinOnly = false,
    shouldAlwaysShowCryptoAmount = false,
    shouldLimitFiatToNativeBalance = false,
    nativeRate = createRate(2000),
    hiddenTokens = [contract],
}: RenderAccountOptions = {}) =>
    renderWithStoreProvider(
        <AccountsListItem
            account={account}
            isNativeCoinOnly={isNativeCoinOnly}
            shouldAlwaysShowCryptoAmount={shouldAlwaysShowCryptoAmount}
            shouldLimitFiatToNativeBalance={shouldLimitFiatToNativeBalance}
        />,
        {
            preloadedState: {
                device: mockStakeRootState({ accounts: [account] }).device,
                wallet: {
                    accounts: [account],
                    settings: { localCurrency: 'usd' },
                    fiat: {
                        current: {
                            [getFiatRateKey(account.symbol, 'usd')]: nativeRate ?? undefined,
                            [getFiatRateKey(account.symbol, 'usd', contract)]: createRate(1),
                        },
                    },
                },
                tokenDefinitions: {
                    [account.symbol]: {
                        coin: {
                            data: [contract],
                            hide: hiddenTokens,
                            show: [],
                            error: false,
                            isLoading: false,
                        },
                    },
                },
            },
        },
    );

describe('AccountsListItem', () => {
    it('keeps staking in the total when the last token is hidden', async () => {
        const { getByText, queryByText, queryByTestId } = await renderAccount();

        expect(getByText(/7,100/)).toBeOnTheScreen();
        expect(queryByText(/7,350/)).not.toBeOnTheScreen();
        expect(queryByTestId('@accountList/item/native-balance')).not.toBeOnTheScreen();
    });

    it('keeps the native asset view limited to the liquid native balance', async () => {
        const { getByText, queryByText, getByTestId } = await renderAccount({
            isNativeCoinOnly: true,
        });

        expect(getByText(/3,000/)).toBeOnTheScreen();
        expect(queryByText(/7,100/)).not.toBeOnTheScreen();
        expect(getByTestId('@accountList/item/native-balance')).toBeOnTheScreen();
    });

    it('hides the native amount when visible tokens contribute to the account total', async () => {
        const { getByText, getByLabelText, queryByTestId } = await renderAccount({
            account: mockEthereumStakingAccount('none', { tokens: ethAccount.tokens }),
            hiddenTokens: [],
        });

        expect(getByText(/3,250/)).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('accountList.numberOfTokens', { numberOfTokens: 1 })),
        ).toBeOnTheScreen();
        expect(queryByTestId('@accountList/item/native-balance')).not.toBeOnTheScreen();
    });

    it('shows the native amount when there are neither visible tokens nor staking', async () => {
        const { getByText, queryByLabelText, getByTestId } = await renderAccount({
            account: mockEthereumStakingAccount('none', { tokens: ethAccount.tokens }),
        });

        expect(getByText(/3,000/)).toBeOnTheScreen();
        expect(getByTestId('@accountList/item/native-balance')).toBeOnTheScreen();
        expect(
            queryByLabelText(getTranslation('accountList.numberOfTokens', { numberOfTokens: 1 })),
        ).not.toBeOnTheScreen();
    });

    it('adds the native amount to the account total when requested', async () => {
        const { getByText, getByLabelText, getByTestId } = await renderAccount({
            hiddenTokens: [],
            shouldAlwaysShowCryptoAmount: true,
        });

        expect(getByText(/7,350/)).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('accountList.numberOfTokens', { numberOfTokens: 1 })),
        ).toBeOnTheScreen();
        expect(getByTestId('@accountList/item/native-balance')).toBeOnTheScreen();
    });

    it('limits the fiat to the liquid native balance while keeping the token badge', async () => {
        const { getByText, queryByText, getByLabelText, getByTestId } = await renderAccount({
            hiddenTokens: [],
            shouldAlwaysShowCryptoAmount: true,
            shouldLimitFiatToNativeBalance: true,
        });

        expect(getByText(/3,000/)).toBeOnTheScreen();
        expect(queryByText(/7,350/)).not.toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('accountList.numberOfTokens', { numberOfTokens: 1 })),
        ).toBeOnTheScreen();
        expect(getByTestId('@accountList/item/native-balance')).toBeOnTheScreen();
    });

    it('excludes staking from the fiat of a native-balance-only account without tokens', async () => {
        const { getByText, queryByText } = await renderAccount({
            shouldLimitFiatToNativeBalance: true,
        });

        expect(getByText(/3,000/)).toBeOnTheScreen();
        expect(queryByText(/7,100/)).not.toBeOnTheScreen();
    });

    it.each([
        { name: 'missing', nativeRate: null },
        {
            name: 'loading without a cached value',
            nativeRate: { ...createRate(undefined), isLoading: true },
        },
        { name: 'zero', nativeRate: createRate(0) },
        {
            name: 'errored with a cached value',
            nativeRate: { ...createRate(2000), error: 'Rate unavailable' },
        },
    ])(
        'does not show a fiat amount for a staking-only account when its rate is $name',
        async ({ nativeRate }) => {
            const { queryByText } = await renderAccount({ nativeRate });

            expect(queryByText(/\$/)).not.toBeOnTheScreen();
        },
    );

    it('keeps the staking total visible while a valid cached rate refreshes', async () => {
        const { getByText } = await renderAccount({
            nativeRate: { ...createRate(2000), isLoading: true },
        });

        expect(getByText(/7,100/)).toBeOnTheScreen();
    });

    it('does not show fiat for a staking testnet account', async () => {
        const { queryByText } = await renderAccount({
            account: mockEthereumStakingAccount('active', { symbol: asNetworkSymbol('thod') }),
        });

        expect(queryByText(/\$/)).not.toBeOnTheScreen();
    });

    it('does not show fiat for a testnet account with visible tokens', async () => {
        const { getByLabelText, queryByText } = await renderAccount({
            account: mockEthereumStakingAccount('none', {
                symbol: asNetworkSymbol('thod'),
                tokens: ethAccount.tokens,
            }),
            hiddenTokens: [],
        });

        expect(
            getByLabelText(getTranslation('accountList.numberOfTokens', { numberOfTokens: 1 })),
        ).toBeOnTheScreen();
        expect(queryByText(/\$/)).not.toBeOnTheScreen();
    });
});
