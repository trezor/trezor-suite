import { getUnixTime, subWeeks } from 'date-fns';

import type { TickerId, LastWeekRates } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import TrezorConnect from '@trezor/connect';
import { scheduleAction } from '@trezor/utils';

import * as coingeckoService from './coingecko';
import * as blockbookService from './blockbook';

const CONNECT_FETCH_TIMEOUT = 10_000;

const getConnectFiatRatesForTimestamp = (
    ticker: TickerId,
    timestamps: number[],
    currency: FiatCurrencyCode,
) =>
    scheduleAction(
        () =>
            TrezorConnect.blockchainGetFiatRatesForTimestamps({
                coin: ticker.symbol,
                token: ticker.tokenAddress,
                timestamps,
                currencies: [currency],
            }),
        {
            timeout: CONNECT_FETCH_TIMEOUT,
        },
    );

export const fetchCurrentFiatRates = async (
    ticker: TickerId,
    currency: FiatCurrencyCode,
): Promise<number | null | undefined> => {
    const { success, payload } = await scheduleAction(
        () =>
            TrezorConnect.blockchainGetCurrentFiatRates({
                coin: ticker.symbol,
                token: ticker.tokenAddress,
                currencies: [currency],
            }),
        { timeout: CONNECT_FETCH_TIMEOUT },
    );

    const rate = success ? payload.rates?.[currency] : null;

    if (rate) return rate;

    const response = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.fetchCurrentFiatRates(ticker.symbol, undefined, currency)
        : await coingeckoService.fetchCurrentFiatRates(ticker);

    return response?.rates?.[currency];
};

export const fetchLastWeekFiatRates = async (
    ticker: TickerId,
    currency: FiatCurrencyCode,
): Promise<number | null | undefined> => {
    const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
    const timestamps = [weekAgoTimestamp];

    const { success, payload } = await getConnectFiatRatesForTimestamp(
        ticker,
        timestamps,
        currency,
    );

    const rate = success ? payload.tickers?.[0]?.rates?.[currency] : null;

    if (rate) return rate;

    const response = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.fetchLastWeekRates(ticker.symbol, currency)
        : await coingeckoService.fetchLastWeekRates(ticker, currency);

    return response?.tickers?.[0]?.rates?.[currency];
};

export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
    currency: FiatCurrencyCode,
): Promise<LastWeekRates | null> => {
    const { success, payload } = await getConnectFiatRatesForTimestamp(
        ticker,
        timestamps,
        currency,
    );

    if (success) {
        return {
            ts: new Date().getTime(),
            symbol: ticker.symbol,
            tickers: payload.tickers,
        };
    }

    const response = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.getFiatRatesForTimestamps(ticker.symbol, timestamps, currency)
        : coingeckoService.getFiatRatesForTimestamps(ticker, timestamps, currency);

    return response;
};
