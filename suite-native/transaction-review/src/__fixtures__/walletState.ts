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
const SOL_ACCOUNT_DESCRIPTOR = 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF';
const TRX_ACCOUNT_DESCRIPTOR = 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8';

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

export const mockSolAccount = (): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('sol'),
        descriptor: asAccountDescriptor(SOL_ACCOUNT_DESCRIPTOR),
        accountLabel: 'Solana #1',
        balance: '10000000000',
        availableBalance: '10000000000',
        formattedBalance: '10.000000000',
    });

export const mockTrxAccount = (): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('trx'),
        descriptor: asAccountDescriptor(TRX_ACCOUNT_DESCRIPTOR),
        accountLabel: 'Tron #1',
        balance: '1000000',
        availableBalance: '1000000',
        formattedBalance: '1',
    });

export const ETH_ACCOUNT_KEY = mockEthAccount().key;
export const BTC_ACCOUNT_KEY = mockBtcAccount().key;
export const SOL_ACCOUNT_KEY = mockSolAccount().key;
export const TRX_ACCOUNT_KEY = mockTrxAccount().key;

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
        mockRate(asNetworkSymbol('sol'), 150),
        mockRate(asNetworkSymbol('trx'), 0.1),
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
    accounts: [mockEthAccount(), mockBtcAccount(), mockSolAccount(), mockTrxAccount()],
    transactions: {
        transactions: {},
        fetchStatusDetail: {},
    },
});
