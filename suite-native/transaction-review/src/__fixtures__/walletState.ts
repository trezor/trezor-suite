import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type FiatRatesState } from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type Rate,
    type RatesByKey,
    type TokenAddress,
    type WalletSettings,
    asAccountDescriptor,
    asCryptoBaseCurrencyCode,
    asTimestamp,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

const ETH_ACCOUNT_DESCRIPTOR = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';
const BTC_ACCOUNT_DESCRIPTOR =
    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy';

export const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

export const mockEthAccount = (): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor(ETH_ACCOUNT_DESCRIPTOR),
        accountLabel: 'Ethereum #1',
        balance: '810000000000',
        availableBalance: '810000000000',
        formattedBalance: '0.00000081',
        tokens: [
            mockAccountToken({
                name: 'USDC',
                symbol: 'usdc',
                contract: USDC_CONTRACT,
                decimals: 6,
                balance: '1',
            }),
        ],
    });

export const mockBtcAccount = (): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('btc'),
        descriptor: asAccountDescriptor(BTC_ACCOUNT_DESCRIPTOR),
        accountLabel: 'Bitcoin #1',
        balance: '12340000',
        availableBalance: '12340000',
        formattedBalance: '0.12340000',
    });

export const ETH_ACCOUNT_KEY = mockEthAccount().key;
export const BTC_ACCOUNT_KEY = mockBtcAccount().key;

const LOCAL_CURRENCY = 'usd';

const mockRate = (symbol: NetworkSymbol, rate: number, tokenAddress?: TokenAddress): Rate => ({
    rate,
    lastTickerTimestamp: asTimestamp(1750315199039),
    lastSuccessfulFetchTimestamp: asTimestamp(1750315199039),
    isLoading: false,
    error: null,
    ticker: { symbol, tokenAddress },
});

const mockRatesByKey = (rates: Rate[]): RatesByKey =>
    Object.fromEntries(
        rates.map(rate => {
            const { symbol, tokenAddress } = rate.ticker;
            const key = tokenAddress
                ? `${symbol}-${tokenAddress}-${LOCAL_CURRENCY}`
                : `${symbol}-${LOCAL_CURRENCY}`;

            return [asCryptoBaseCurrencyCode(key), rate];
        }),
    );

const mockFiatRatesState = (): FiatRatesState => ({
    current: mockRatesByKey([
        mockRate(asNetworkSymbol('eth'), 1000),
        mockRate(asNetworkSymbol('btc'), 100000),
        mockRate(asNetworkSymbol('eth'), 0.99, USDC_CONTRACT),
    ]),
    lastWeek: {},
    historic: {},
});

export const mockWalletState = () => ({
    // Only the currency and address display mode are read by the review
    // components; the remaining settings are irrelevant to these tests.
    settings: {
        localCurrency: LOCAL_CURRENCY,
        addressDisplayType: AddressDisplayOptions.CHUNKED,
    } as WalletSettings,
    fiat: mockFiatRatesState(),
    accounts: [mockEthAccount(), mockBtcAccount()],
    transactions: {
        transactions: {},
        fetchStatusDetail: {},
    },
});
