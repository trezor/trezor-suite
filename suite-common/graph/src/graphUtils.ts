import { A, D, pipe } from '@mobily/ts-belt';
import {
    differenceInMinutes,
    eachMinuteOfInterval,
    fromUnixTime,
    getUnixTime,
    roundToNearestMinutes,
    subHours,
} from 'date-fns';

import { type TimestampedRates } from '@suite-common/wallet-types';
import {
    AMOUNT_UNIT_ZERO,
    asAmountUnit,
    getDecimalsForBaseCurrency,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import type {
    AccountHistoryBalancePoint,
    AccountWithBalanceHistory,
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
    FiatRatesItem,
} from './types';

type GetDataStepInMinutesParams = {
    startOfTimeFrameDate: Date;
    endOfTimeFrameDate: Date;
    numberOfPoints: number;
};

export const getDataStepInMinutes = ({
    startOfTimeFrameDate,
    endOfTimeFrameDate,
    numberOfPoints,
}: GetDataStepInMinutesParams): number => {
    const differenceMinutes = differenceInMinutes(endOfTimeFrameDate, startOfTimeFrameDate);

    return Math.ceil(differenceMinutes / numberOfPoints);
};

export const getTimestampsInTimeFrame = (
    startOfTimeFrameDate: Date,
    endOfTimeFrameDate: Date,
    numberOfPoints: number,
) => {
    const stepInMinutes = getDataStepInMinutes({
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        numberOfPoints,
    });

    const intervalEndDate = fromUnixTime(getUnixTime(endOfTimeFrameDate));

    const datesInRange = eachMinuteOfInterval(
        {
            start: startOfTimeFrameDate,
            end: intervalEndDate,
        },
        {
            step: stepInMinutes,
        },
    );
    const datesInRangeUnixTime = A.map(datesInRange, date => getUnixTime(date));

    return datesInRangeUnixTime as number[];
};

// Blockbook drops tickers it has no rate for, so the response cannot be zipped with the request
// by array position — it can be shorter and out of order, and each ticker carries its own
// authoritative `ts` (the nearest stored rate, e.g. tokens only have daily rates while native
// coins have hourly ones). Rates for all coins must also end up on the SAME timestamp grid,
// because merging accounts sums points with equal timestamps — keying points by the ticker `ts`
// would interleave per-coin values instead of summing them. Each requested timestamp therefore
// gets the rates of the nearest returned ticker and keeps the requested time, deduplicated
// because the frame end is requested twice whenever the time frame length aligns with the point
// step, which used to double the last merged point.
export const mapTickersToFiatRatesItems = (
    tickers: TimestampedRates[],
    timestamps: number[],
): FiatRatesItem[] => {
    const sortedTickers = tickers.toSorted((a, b) => a.ts - b.ts);
    if (A.isEmpty(sortedTickers)) return [];

    const uniqueTimestamps = [...new Set(timestamps)].toSorted((a, b) => a - b);

    // Both lists are ascending, so the nearest ticker index never moves backwards.
    let tickerIndex = 0;

    return uniqueTimestamps.map(timestamp => {
        while (tickerIndex + 1 < sortedTickers.length) {
            const currentDistance = Math.abs(sortedTickers[tickerIndex]!.ts - timestamp);
            const nextDistance = Math.abs(sortedTickers[tickerIndex + 1]!.ts - timestamp);
            if (nextDistance > currentDistance) break;
            tickerIndex += 1;
        }

        return { time: timestamp, rates: sortedTickers[tickerIndex]!.rates };
    });
};

type MapCryptoBalanceMovementToFixedTimeFrameParams = {
    balanceHistory: AccountHistoryBalancePoint[];
    fiatRates: FiatRatesItem[];
    baseCurrencyCode: BaseCurrencyCode;
};

export const mapCryptoBalanceMovementToFixedTimeFrame = ({
    balanceHistory,
    fiatRates,
    baseCurrencyCode,
}: MapCryptoBalanceMovementToFixedTimeFrameParams): readonly FiatGraphPointWithCryptoBalance[] =>
    pipe(
        fiatRates,
        A.map(fiatRatePoint => {
            let fiatRate = fiatRatePoint.rates[baseCurrencyCode] ?? 0;
            // for some tokens we could get fiat rate -1, which is not valid
            fiatRate = fiatRate < 0 ? 0 : fiatRate;
            const rateDate = fromUnixTime(fiatRatePoint.time);

            if (fiatRate === 0) {
                // return early if the fiat rate is 0 to save resources on further calculations (find and BigNumber are slow)
                return {
                    date: rateDate,
                    cryptoBalance: '0',
                    value: 0,
                };
            }

            // Find the latest account balance before or at the fiatRatePoint time
            const accountBalancePoint = balanceHistory.find(
                point => point.time >= fiatRatePoint.time,
            );

            const cryptoBalance = accountBalancePoint
                ? asAmountUnit(new BigNumber(accountBalancePoint.cryptoBalance))
                : AMOUNT_UNIT_ZERO;

            const value = toFiatCurrency({
                amount: cryptoBalance,
                rate: fiatRate,
            });

            const baseCurrencyDecimal = getDecimalsForBaseCurrency({
                code: baseCurrencyCode,
                // Here, we NEVER use sats. The formatting to sats shall ALWAYS be a domain of the view-component.
                isInSats: false,
            });

            return {
                date: rateDate,
                cryptoBalance: cryptoBalance.toFixed(),
                // We display only to specific decimal places the graph.
                // So if there is any value lower than that, we want to round it.
                value: value !== null ? Number(value.toFixed(baseCurrencyDecimal)) : 0,
            };
        }),
    );

export const mergeMultipleFiatBalanceHistories = (
    fiatBalancesHistories: readonly (readonly FiatGraphPointWithCryptoBalance[])[],
): readonly FiatGraphPoint[] =>
    pipe(
        fiatBalancesHistories,
        A.flat,
        A.groupBy(fiatBalancePoint => getUnixTime(fiatBalancePoint.date)),
        D.mapWithKey((timestamp, fiatBalancePoints) => {
            const fiatBalance = fiatBalancePoints
                ? A.reduce(
                      fiatBalancePoints,
                      0,
                      (acc, fiatBalancePoint) => acc + fiatBalancePoint.value,
                  )
                : 0;

            return {
                date: fromUnixTime(timestamp),
                value: fiatBalance,
            };
        }),
        D.values,
    );

export const findOldestBalanceMovementTimestamp = (
    accountsWithBalanceHistory: AccountWithBalanceHistory[],
): number => {
    const allOldestTimestamps: number[] = [];

    accountsWithBalanceHistory.forEach(account => {
        const oldestTimestamp = account.balanceHistory[0]?.time;
        if (oldestTimestamp) {
            allOldestTimestamps.push(oldestTimestamp);
        }
    });

    return Math.min(...allOldestTimestamps);
};

// The end of the timeframe is rounded to keep it referentially stable between refetches
// and to hit the balance history cache, which is keyed by the timeframe dates.
export const getTimeFrameForHistoryHours = (timeframeHours: number | null) => {
    const endOfTimeFrameDate = roundToNearestMinutes(new Date(), {
        nearestTo: 10,
        roundingMethod: 'floor',
    });
    // If the start date is null, we are fetching all data till the first account movement.
    const startOfTimeFrameDate = timeframeHours
        ? subHours(endOfTimeFrameDate, timeframeHours)
        : null;

    return { endOfTimeFrameDate, startOfTimeFrameDate };
};
