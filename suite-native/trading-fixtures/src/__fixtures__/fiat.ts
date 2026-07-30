import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type { Rate, Timestamp, WalletSettings } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

const btcSymbol = asNetworkSymbol('btc');

export const createMockRate = (rate: number, symbol: NetworkSymbol): Rate => ({
    rate,
    lastTickerTimestamp: 1000000 as Timestamp,
    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
    isLoading: false,
    error: null,
    ticker: { symbol },
});

export const mockWalletFiatRatesAndSettings = (customRates: { [x: string]: Rate } = {}) => ({
    settings: {
        localCurrency: 'usd',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    } as WalletSettings,
    fiat: {
        current: {
            [getFiatRateKey(btcSymbol, 'usd')]: createMockRate(50000, btcSymbol),
            ...customRates,
        },
        lastWeek: {},
        historic: {},
    },
});
