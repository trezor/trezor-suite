import { getUnixTime, subWeeks } from 'date-fns';

import { type BackendType, isBlockbookBasedNetwork } from '@suite-common/wallet-config';
import type {
    FiatRatesResult,
    HistoricRates,
    TickerId,
    Timestamp,
    TimestampedRates,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';
import {
    SCHEDULE_ACTION_ABORTED_ERROR_MESSAGE,
    SCHEDULE_ACTION_DEADLINE_ERROR_MESSAGE,
    SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE,
    scheduleAction,
} from '@trezor/utils';

import * as blockbookService from './blockbook';
import { ParallelRequestsCache } from './cache';
import * as coingeckoService from './coingecko';

const CONNECT_FETCH_TIMEOUT = 10_000;
const SECONDS_PER_DAY = 24 * 60 * 60;

const parallelRequestsCache = new ParallelRequestsCache();

const isSameUTCDay = (firstTimestamp: number, secondTimestamp: number): boolean =>
    Math.floor(firstTimestamp / SECONDS_PER_DAY) === Math.floor(secondTimestamp / SECONDS_PER_DAY);

type GetAvailableTickersParams = {
    tickers: TimestampedRates[];
    timestamps: number[];
    baseCurrencyCode: BaseCurrencyCode;
};

const getAvailableTickers = ({
    tickers,
    timestamps,
    baseCurrencyCode,
}: GetAvailableTickersParams): TimestampedRates[] =>
    tickers.flatMap((ticker, index) => {
        const timestamp = timestamps[index];
        const rate = ticker.rates[baseCurrencyCode];

        if (
            timestamp === undefined ||
            rate === undefined ||
            rate < 0 ||
            !isSameUTCDay(timestamp, ticker.ts)
        ) {
            return [];
        }

        return [{ ...ticker, ts: timestamp }];
    });

type GetTickersWithFallbackParams = GetAvailableTickersParams & {
    ticker: TickerId;
};

const getTickersWithFallback = async ({
    ticker,
    tickers,
    timestamps,
    baseCurrencyCode,
}: GetTickersWithFallbackParams): Promise<TimestampedRates[]> => {
    const availableTickers = getAvailableTickers({
        tickers,
        timestamps,
        baseCurrencyCode,
    });
    const availableTickersByTimestamp = new Map(
        availableTickers.map(availableTicker => [availableTicker.ts, availableTicker]),
    );
    const missingTimestamps = timestamps.filter(
        timestamp => !availableTickersByTimestamp.has(timestamp),
    );

    if (missingTimestamps.length === 0) {
        return availableTickers;
    }

    const coingeckoResponse = await coingeckoService.getFiatRatesForTimestamps(
        ticker,
        missingTimestamps,
        baseCurrencyCode,
    );
    const coingeckoTickersByTimestamp = new Map(
        coingeckoResponse?.tickers.map(coingeckoTicker => [coingeckoTicker.ts, coingeckoTicker]) ??
            [],
    );

    return timestamps.flatMap(timestamp => {
        const availableTicker = availableTickersByTimestamp.get(timestamp);

        if (availableTicker) {
            return [availableTicker];
        }

        const coingeckoTicker = coingeckoTickersByTimestamp.get(timestamp);
        const rate = coingeckoTicker?.rates[baseCurrencyCode];

        if (!coingeckoTicker || rate === undefined || rate < 0) {
            return [];
        }

        return [coingeckoTicker];
    });
};

type FiatRatesParams = {
    ticker: TickerId;
    localCurrency: BaseCurrencyCode;
    backendType?: BackendType;
    skipCache?: boolean;
};

const getConnectFiatRatesForTimestamp = async (
    ticker: TickerId,
    timestamps: number[],
    baseCurrencyCode: BaseCurrencyCode,
): Promise<
    | ReturnType<typeof TrezorConnect.blockchainGetFiatRatesForTimestamps>
    | { success: false; payload: null }
> => {
    try {
        return await scheduleAction(
            () =>
                TrezorConnect.blockchainGetFiatRatesForTimestamps({
                    coin: ticker.symbol,
                    token: ticker.tokenAddress,
                    timestamps,
                    currencies: [baseCurrencyCode],
                }),
            {
                timeout: CONNECT_FETCH_TIMEOUT,
            },
        );
    } catch (error) {
        if (
            ('name' in error && error.name === 'AbortError') ||
            !('message' in error) ||
            (error.message !== SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE &&
                error.message !== SCHEDULE_ACTION_DEADLINE_ERROR_MESSAGE &&
                error.message !== SCHEDULE_ACTION_ABORTED_ERROR_MESSAGE)
        ) {
            throw error;
        }

        return Promise.resolve({
            success: false,
            payload: null,
        });
    }
};

export const fetchCurrentFiatRates = ({
    ticker,
    localCurrency,
    backendType,
    skipCache,
}: FiatRatesParams): Promise<FiatRatesResult | null> =>
    parallelRequestsCache.cache(
        ['fetchCurrentFiatRates', ticker.symbol, ticker.tokenAddress, localCurrency],
        async () => {
            // If skipCache is true, skip Blockbook support check and fetch fiat rates
            // directly from Coingecko to ensure up-to-date values.
            if (isBlockbookBasedNetwork(ticker.symbol) && backendType !== 'evm-rpc' && !skipCache) {
                if (backendType !== 'electrum') {
                    const result = await scheduleAction(
                        () =>
                            TrezorConnect.blockchainGetCurrentFiatRates({
                                coin: ticker.symbol,
                                token: ticker.tokenAddress,
                                currencies: [localCurrency],
                            }),
                        { timeout: CONNECT_FETCH_TIMEOUT },
                    );

                    if (!result.success && result.error.message === 'No tickers found!') {
                        const fallbackCoinGeckoResponse =
                            await coingeckoService.fetchCurrentFiatRates(ticker);

                        if (!fallbackCoinGeckoResponse) {
                            return null;
                        }

                        return {
                            rate: fallbackCoinGeckoResponse?.rates?.[localCurrency],
                            lastTickerTimestamp: fallbackCoinGeckoResponse?.ts as Timestamp,
                        };
                    }

                    if (!result.success) return null;

                    const rate = result.payload.rates?.[localCurrency];

                    // in case blockbook does not know fiat rate, it returns -1
                    if (!rate || rate < 0) return null;

                    return {
                        rate,
                        lastTickerTimestamp: result.payload.ts as Timestamp,
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

            const coingeckoResponse = await coingeckoService.fetchCurrentFiatRates(ticker, {
                skipCache,
            });

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
    backendType,
}: FiatRatesParams): Promise<FiatRatesResult | null> =>
    parallelRequestsCache.cache(
        ['fetchLastWeekFiatRates', ticker.symbol, ticker.tokenAddress, localCurrency],
        async () => {
            const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
            const timestamps = [weekAgoTimestamp];

            if (isBlockbookBasedNetwork(ticker.symbol)) {
                if (backendType !== 'electrum') {
                    const result = await getConnectFiatRatesForTimestamp(
                        ticker,
                        timestamps,
                        localCurrency,
                    );

                    if (!result.success) return null;

                    const rate = result.payload.tickers?.[0]?.rates?.[localCurrency];

                    // in case blockbook does not know fiat rate, it returns -1
                    if (!rate || rate < 0) return null;

                    return {
                        rate,
                        lastTickerTimestamp: result.payload.tickers?.[0]?.ts as Timestamp,
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
    baseCurrencyCode: BaseCurrencyCode,
    isElectrumBackend: boolean,
    isCoingeckoForced: boolean = false,
): Promise<HistoricRates | null> =>
    parallelRequestsCache.cache(
        [
            'getFiatRatesForTimestamps',
            ticker.symbol,
            ticker?.tokenAddress,
            baseCurrencyCode,
            ...timestamps,
        ],
        async () => {
            if (isBlockbookBasedNetwork(ticker.symbol) && !isCoingeckoForced) {
                if (!isElectrumBackend) {
                    const result = await getConnectFiatRatesForTimestamp(
                        ticker,
                        timestamps,
                        baseCurrencyCode,
                    );

                    if (!result.success) return null;

                    return {
                        ts: new Date().getTime(),
                        symbol: ticker.symbol,
                        tickers: await getTickersWithFallback({
                            ticker,
                            tickers: result.payload.tickers,
                            timestamps,
                            baseCurrencyCode,
                        }),
                    };
                }

                const blockbookResponse = await blockbookService.getFiatRatesForTimestamps(
                    'btc',
                    timestamps,
                    baseCurrencyCode,
                );

                if (blockbookResponse) {
                    return {
                        ...blockbookResponse,
                        tickers: await getTickersWithFallback({
                            ticker,
                            tickers: blockbookResponse.tickers,
                            timestamps,
                            baseCurrencyCode,
                        }),
                    };
                }
            }

            const coingeckoResponse = await coingeckoService.getFiatRatesForTimestamps(
                ticker,
                timestamps,
                baseCurrencyCode,
            );

            if (!coingeckoResponse) {
                return null;
            }

            return coingeckoResponse;
        },
    );
