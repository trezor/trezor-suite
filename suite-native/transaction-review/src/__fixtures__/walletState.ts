import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type FiatRatesState } from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type CurrentRate,
    type CurrentRatesByKey,
    type TokenAddress,
    type WalletSettings,
    asAccountDescriptor,
    asCryptoBaseCurrencyCode,
    asTimestamp,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

const ETH_ACCOUNT_DESCRIPTOR = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';
const ADA_ACCOUNT_DESCRIPTOR =
    '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290cabdd60f6d4ba6e6d6d2a5d8ee75e7b1d1d0b3ab5d4ac2d6e8';
const BTC_ACCOUNT_DESCRIPTOR =
    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy';

export const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
export const HOSKY_CONTRACT =
    'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235484f534b59' as TokenAddress;
export const CARDANO_TOKEN_CONTRACT =
    '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43' as TokenAddress;
export const CARDANO_TOKEN_FINGERPRINT = 'asset1pwhywk7x54g739z3dqs245q62yu47vjh8gapjv';
export const CARDANO_NO_DECIMALS_TOKEN_CONTRACT =
    'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a6e6f6465' as TokenAddress;

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

export const mockAdaAccount = (): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('ada'),
        descriptor: asAccountDescriptor(ADA_ACCOUNT_DESCRIPTOR),
        accountLabel: 'Cardano #1',
        balance: '5000000',
        availableBalance: '5000000',
        formattedBalance: '5',
        tokens: [
            mockAccountToken({
                name: 'HOSKY',
                symbol: 'hosky',
                contract: HOSKY_CONTRACT,
                decimals: 0,
                balance: '100',
            }),
            mockAccountToken({
                name: CARDANO_TOKEN_FINGERPRINT,
                symbol: 'CHOC',
                contract: CARDANO_TOKEN_CONTRACT,
                fingerprint: CARDANO_TOKEN_FINGERPRINT,
                standard: 'BLOCKFROST',
                decimals: 5,
                balance: '1000000',
            }),
            mockAccountToken({
                name: 'asset1l8ed6nmt5secvlurjl5p0vr8v49qqfsuduv02u',
                symbol: 'NODE',
                contract: CARDANO_NO_DECIMALS_TOKEN_CONTRACT,
                fingerprint: 'asset1l8ed6nmt5secvlurjl5p0vr8v49qqfsuduv02u',
                standard: 'BLOCKFROST',
                decimals: 0,
                balance: '10',
            }),
        ],
    });

export const ETH_ACCOUNT_KEY = mockEthAccount().key;
export const ADA_ACCOUNT_KEY = mockAdaAccount().key;
export const BTC_ACCOUNT_KEY = mockBtcAccount().key;

const LOCAL_CURRENCY = 'usd';

// In dollars, the dollar rate is the rate itself.
const mockRate = (
    symbol: NetworkSymbol,
    rate: number,
    tokenAddress?: TokenAddress,
): CurrentRate => ({
    rate,
    usdRate: rate,
    lastTickerTimestamp: asTimestamp(1750315199039),
    lastSuccessfulFetchTimestamp: asTimestamp(1750315199039),
    isLoading: false,
    error: null,
    ticker: { symbol, tokenAddress },
});

const mockRatesByKey = (rates: CurrentRate[]): CurrentRatesByKey =>
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
    accounts: [mockEthAccount(), mockBtcAccount(), mockAdaAccount()],
    transactions: {
        transactions: {},
        fetchStatusDetail: {},
    },
});
