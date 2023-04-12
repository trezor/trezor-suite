import type { LastWeekRates, TickerId, TimestampedRates } from '@suite-common/wallet-types';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import TrezorConnect from '@trezor/connect';
import * as blockbookService from './blockbook';
import * as coingeckoService from './coingecko';

export const { getTickerConfig, fetchCurrentTokenFiatRates } = coingeckoService;

export const fetchCurrentFiatRates = async (ticker: TickerId): Promise<TimestampedRates | null> => {
    const res = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.fetchCurrentFiatRates(ticker.symbol)
        : null;
    return res ?? coingeckoService.fetchCurrentFiatRates(ticker);
};

export const fetchLastWeekFiatRates = async (
    ticker: TickerId,
    currency: string,
): Promise<LastWeekRates | null> => {
    const res = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.fetchLastWeekRates(ticker.symbol, currency)
        : null;
    return res ?? coingeckoService.fetchLastWeekRates(ticker, currency);
};

export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
): Promise<LastWeekRates | null> => {
    const res = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.getFiatRatesForTimestamps(ticker.symbol, timestamps)
        : null;
    return res ?? coingeckoService.getFiatRatesForTimestamps(ticker, timestamps);
};

export const fetchFiatRateWithFallback = async ({
    ticker,
    fiatCurrency,
}: {
    ticker: TickerId;
    fiatCurrency: FiatCurrencyCode;
}) => {
    const { symbol, tokenAddress, mainNetworkSymbol } = ticker;
    const { success, payload } = await TrezorConnect.blockchainGetCurrentFiatRates({
        coin: mainNetworkSymbol || symbol,
        token: tokenAddress,
        currencies: [fiatCurrency],
    });

    const rate = success ? payload.rates?.[fiatCurrency] : null;
    if (rate) return payload;

    return fetchCurrentFiatRates(ticker);
};

export const fetchFiatRatesForTimestampsFallback = async ({
    ticker,
    fiatCurrency,
    timestamps,
}: {
    ticker: TickerId;
    fiatCurrency: FiatCurrencyCode;
    timestamps: number[];
}) => {
    const { success, payload } = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
        coin: ticker.symbol,
        token: ticker.tokenAddress,
        timestamps,
        currencies: [fiatCurrency],
    });

    const rate = success ? payload.tickers?.[0]?.rates?.[fiatCurrency] : null;
    if (rate) return payload;

    return fetchLastWeekFiatRates(ticker, fiatCurrency);
};
