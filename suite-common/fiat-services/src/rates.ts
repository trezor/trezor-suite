import { getUnixTime, subWeeks } from 'date-fns';

import type { TickerId, LastWeekRates } from '@suite-common/wallet-types';
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
}: fiatRatesParams): Promise<number | null | undefined> => {
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

            const rate = success ? payload.rates?.[localCurrency] : null;

            return rate;
        }

        const blockbookResponse = await blockbookService.fetchCurrentFiatRates(
            'btc',
            undefined,
            localCurrency,
        );

        if (blockbookResponse) return blockbookResponse.rates?.[localCurrency];
    }

    const coingeckoResponse = await coingeckoService.fetchCurrentFiatRates(ticker);

    return coingeckoResponse?.rates?.[localCurrency];
};

export const fetchLastWeekFiatRates = async ({
    ticker,
    localCurrency,
    isElectrumBackend,
}: fiatRatesParams): Promise<number | null | undefined> => {
    const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
    const timestamps = [weekAgoTimestamp];

    if (isBlockbookBasedNetwork(ticker.symbol)) {
        if (!isElectrumBackend) {
            const { success, payload } = await getConnectFiatRatesForTimestamp(
                ticker,
                timestamps,
                localCurrency,
            );

            const rate = success ? payload.tickers?.[0]?.rates?.[localCurrency] : null;

            return rate;
        }

        const blockbookResponse = await blockbookService.fetchLastWeekRates('btc', localCurrency);

        if (blockbookResponse) return blockbookResponse.tickers?.[0]?.rates?.[localCurrency];
    }

    const coingeckoResponse = await coingeckoService.fetchLastWeekRates(ticker, localCurrency);

    return coingeckoResponse?.tickers?.[0]?.rates?.[localCurrency];
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
