import { getUnixTime, subWeeks } from 'date-fns';

import type { TickerId, LastWeekRates } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import TrezorConnect from '@trezor/connect';
import { scheduleAction } from '@trezor/utils';

import * as coingeckoService from './coingecko';
import * as blockbookService from './blockbook';

export const { getTickerConfig, fetchCurrentTokenFiatRates } = coingeckoService;

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
    const responseConnect = await scheduleAction(
        () =>
            TrezorConnect.blockchainGetCurrentFiatRates({
                coin: ticker.symbol,
                token: ticker.tokenAddress,
                currencies: [currency],
            }),
        { timeout: CONNECT_FETCH_TIMEOUT },
    );

    const rateFromConnect = responseConnect.success
        ? responseConnect.payload.rates?.[currency]
        : null;

    if (rateFromConnect) {
        return rateFromConnect;
    }

    const responseBlockbookService = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.fetchCurrentFiatRates(ticker.symbol, undefined, currency)
        : null;

    const response =
        responseBlockbookService ?? (await coingeckoService.fetchCurrentFiatRates(ticker));

    return response?.rates?.[currency];
};

export const fetchLastWeekFiatRates = async (
    ticker: TickerId,
    currency: FiatCurrencyCode,
): Promise<number | null | undefined> => {
    const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));

    const responseConnect = await getConnectFiatRatesForTimestamp(
        ticker,
        [weekAgoTimestamp],
        currency,
    );

    const rateFromConnect = responseConnect.success
        ? responseConnect.payload.tickers?.[0]?.rates?.[currency]
        : null;

    if (rateFromConnect) {
        return rateFromConnect;
    }

    const responseBlockbookService = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.fetchLastWeekRates(ticker.symbol, currency)
        : null;

    const response =
        responseBlockbookService ?? (await coingeckoService.fetchLastWeekRates(ticker, currency));

    return response?.tickers?.[0]?.rates?.[currency];
};

export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
    currency: FiatCurrencyCode,
): Promise<LastWeekRates | null> => {
    const responseConnect = await getConnectFiatRatesForTimestamp(ticker, timestamps, currency);

    if (responseConnect.success) {
        return {
            ts: new Date().getTime(),
            symbol: ticker.symbol,
            tickers: responseConnect.payload.tickers,
        };
    }

    const responseBlockbookService = blockbookService.isTickerSupported(ticker)
        ? await blockbookService.getFiatRatesForTimestamps(ticker.symbol, timestamps, currency)
        : null;

    return (
        responseBlockbookService ??
        coingeckoService.getFiatRatesForTimestamps(ticker, timestamps, currency)
    );
};
