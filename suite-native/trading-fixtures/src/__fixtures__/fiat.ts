import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type {
    CurrentRate,
    CurrentRatesByKey,
    Timestamp,
    WalletSettings,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

// In dollars, the dollar rate is the rate itself.
export const createMockRate = (rate: number, symbol: NetworkSymbol): CurrentRate => ({
    rate,
    usdRate: rate,
    lastTickerTimestamp: 1000000 as Timestamp,
    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
    isLoading: false,
    error: null,
    ticker: { symbol },
});

export const mockWalletFiatRatesAndSettings = (customRates: CurrentRatesByKey = {}) => ({
    settings: {
        localCurrency: 'usd',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    } as WalletSettings,
    fiat: {
        current: {
            [getFiatRateKey(asNetworkSymbol('btc'), 'usd')]: createMockRate(
                50000,
                asNetworkSymbol('btc'),
            ),
            ...customRates,
        },
        lastWeek: {},
        historic: {},
    },
});
