import { getUnixTime, subWeeks } from 'date-fns';

import type {
    TickerId,
    HistoricRates,
    Timestamp,
    FiatRatesResult,
} from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import TrezorConnect from '@trezor/connect';
import { scheduleAction } from '@trezor/utils';
import { isBlockbookBasedNetwork } from '@suite-common/wallet-config';

import * as coingeckoService from './coingecko';
import * as blockbookService from './blockbook';
import { ParallelRequestsCache } from './cache';

const CONNECT_FETCH_TIMEOUT = 10_000;

const parallelRequestsCache = new ParallelRequestsCache();

type FiatRatesParams = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    isElectrumBackend: boolean;
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

export const fetchCurrentFiatRates = ({
    ticker,
    localCurrency,
    isElectrumBackend,
}: FiatRatesParams): Promise<FiatRatesResult | null> =>
    parallelRequestsCache.cache(
        ['fetchCurrentFiatRates', ticker.symbol, ticker.tokenAddress, localCurrency],
        async () => {
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

                    if (!success) return null;

                    const rate = payload.rates?.[localCurrency];

                    // in case blockbook does not know fiat rate, it returns -1
                    if (!rate || rate < 0) return null;

                    return {
                        rate,
                        lastTickerTimestamp: payload.ts as Timestamp,
                    };
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

            if (!coingeckoResponse) {
                return null;
            }

            return {
                rate: coingeckoResponse?.rates?.[localCurrency],
                lastTickerTimestamp: coingeckoResponse?.ts as Timestamp,
            };
        },
    );

export const fetchLastWeekFiatRates = ({
    ticker,
    localCurrency,
    isElectrumBackend,
}: FiatRatesParams): Promise<FiatRatesResult | null> =>
    parallelRequestsCache.cache(
        ['fetchLastWeekFiatRates', ticker.symbol, ticker.tokenAddress, localCurrency],
        async () => {
            const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
            const timestamps = [weekAgoTimestamp];

            if (isBlockbookBasedNetwork(ticker.symbol)) {
                if (!isElectrumBackend) {
                    const { success, payload } = await getConnectFiatRatesForTimestamp(
                        ticker,
                        timestamps,
                        localCurrency,
                    );

                    if (!success) return null;

                    const rate = payload.tickers?.[0]?.rates?.[localCurrency];

                    // in case blockbook does not know fiat rate, it returns -1
                    if (!rate || rate < 0) return null;

                    return {
                        rate,
                        lastTickerTimestamp: payload.tickers?.[0]?.ts as Timestamp,
                    };
                }

                const blockbookResponse = await blockbookService.fetchLastWeekRates(
                    'btc',
                    localCurrency,
                );

                if (blockbookResponse)
                    return {
                        rate: blockbookResponse.tickers?.[0]?.rates?.[localCurrency],
                        lastTickerTimestamp: blockbookResponse.tickers?.[0]?.ts as Timestamp,
                    };
            }

            const coingeckoResponse = await coingeckoService.fetchLastWeekRates(
                ticker,
                localCurrency,
            );

            if (!coingeckoResponse) {
                return null;
            }

            return {
                rate: coingeckoResponse?.tickers?.[0]?.rates?.[localCurrency],
                lastTickerTimestamp: coingeckoResponse?.tickers?.[0]?.ts as Timestamp,
            };
        },
    );

export const getFiatRatesForTimestamps = (
    ticker: TickerId,
    timestamps: number[],
    localCurrency: FiatCurrencyCode,
    isElectrumBackend: boolean,
): Promise<HistoricRates | null> =>
    parallelRequestsCache.cache(
        [
            'getFiatRatesForTimestamps',
            ticker.symbol,
            ticker?.tokenAddress,
            localCurrency,
            ...timestamps,
        ],
        async () => {
            if (isBlockbookBasedNetwork(ticker.symbol)) {
                if (!isElectrumBackend) {
                    const { success, payload } = await getConnectFiatRatesForTimestamp(
                        ticker,
                        timestamps,
                        localCurrency,
                    );

                    if (!success) return null;

                    // in case blockbook does not know fiat rate, it returns -1
                    const validTickers = payload.tickers.filter(
                        tick => tick.rates[localCurrency] && tick.rates[localCurrency] >= 0,
                    );

                    return {
                        ts: new Date().getTime(),
                        symbol: ticker.symbol,
                        tickers: validTickers,
                    };
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

            if (!coingeckoResponse) {
                return null;
            }

            return coingeckoResponse;
        },
    );
