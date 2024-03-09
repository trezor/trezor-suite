import { getUnixTime, subWeeks } from 'date-fns';

import type { TickerId, LastWeekRates, Timestamp } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import TrezorConnect from '@trezor/connect';
import { scheduleAction } from '@trezor/utils';
import { isBlockbookBasedNetwork } from '@suite-common/wallet-config';

import * as coingeckoService from './coingecko';
import * as blockbookService from './blockbook';

const CONNECT_FETCH_TIMEOUT = 10_000;

type fiatRatesParams = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    isElectrumBackend: boolean;
};

type fiatRatesResult = {
    rate: number | undefined;
    lastTickerTimestamp: Timestamp;
};

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

export const fetchCurrentFiatRates = async ({
    ticker,
    localCurrency,
    isElectrumBackend,
}: fiatRatesParams): Promise<fiatRatesResult | null> => {
    if (isBlockbookBasedNetwork(ticker.symbol)) {
        if (!isElectrumBackend) {
            const { success, payload } = await scheduleAction(
                () =>
                    TrezorConnect.blockchainGetCurrentFiatRates({
                        coin: ticker.symbol,
                        token: ticker.tokenAddress,
                        currencies: [localCurrency],
                    }),
                { timeout: CONNECT_FETCH_TIMEOUT },
            );

            const rate = success
                ? {
                      rate: payload.rates?.[localCurrency],
                      lastTickerTimestamp: payload.ts as Timestamp,
                  }
                : null;

            return rate;
        }

        const blockbookResponse = await blockbookService.fetchCurrentFiatRates(
            'btc',
            undefined,
            localCurrency,
        );

        if (blockbookResponse)
            return {
                rate: blockbookResponse.rates?.[localCurrency],
                lastTickerTimestamp: blockbookResponse.ts as Timestamp,
            };
    }

    const coingeckoResponse = await coingeckoService.fetchCurrentFiatRates(ticker);

    return {
        rate: coingeckoResponse?.rates?.[localCurrency],
        lastTickerTimestamp: coingeckoResponse?.ts as Timestamp,
    };
};

export const fetchLastWeekFiatRates = async ({
    ticker,
    localCurrency,
    isElectrumBackend,
}: fiatRatesParams): Promise<fiatRatesResult | null> => {
    const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
    const timestamps = [weekAgoTimestamp];

    if (isBlockbookBasedNetwork(ticker.symbol)) {
        if (!isElectrumBackend) {
            const { success, payload } = await getConnectFiatRatesForTimestamp(
                ticker,
                timestamps,
                localCurrency,
            );

            const rate = success
                ? {
                      rate: payload.tickers?.[0]?.rates?.[localCurrency],
                      lastTickerTimestamp: payload.tickers?.[0]?.ts as Timestamp,
                  }
                : null;

            return rate;
        }

        const blockbookResponse = await blockbookService.fetchLastWeekRates('btc', localCurrency);

        if (blockbookResponse)
            return {
                rate: blockbookResponse.tickers?.[0]?.rates?.[localCurrency],
                lastTickerTimestamp: blockbookResponse.tickers?.[0]?.ts as Timestamp,
            };
    }

    const coingeckoResponse = await coingeckoService.fetchLastWeekRates(ticker, localCurrency);

    return {
        rate: coingeckoResponse?.tickers?.[0]?.rates?.[localCurrency],
        lastTickerTimestamp: coingeckoResponse?.tickers?.[0]?.ts as Timestamp,
    };
};

export const getFiatRatesForTimestamps = async (
    ticker: TickerId,
    timestamps: number[],
    localCurrency: FiatCurrencyCode,
    isElectrumBackend: boolean,
): Promise<LastWeekRates | null> => {
    if (isBlockbookBasedNetwork(ticker.symbol)) {
        if (!isElectrumBackend) {
            const { success, payload } = await getConnectFiatRatesForTimestamp(
                ticker,
                timestamps,
                localCurrency,
            );

            const rates = success
                ? {
                      ts: new Date().getTime(),
                      symbol: ticker.symbol,
                      tickers: payload.tickers,
                  }
                : null;

            return rates;
        }

        const blockbookResponse = await blockbookService.getFiatRatesForTimestamps(
            'btc',
            timestamps,
            localCurrency,
        );

        if (blockbookResponse) return blockbookResponse;
    }

    const coingeckoResponse = await coingeckoService.getFiatRatesForTimestamps(
        ticker,
        timestamps,
        localCurrency,
    );

    return coingeckoResponse;
};
