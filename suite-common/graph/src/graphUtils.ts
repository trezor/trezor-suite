import { A, D, pipe } from '@mobily/ts-belt';
import { differenceInMinutes, eachMinuteOfInterval, fromUnixTime, getUnixTime } from 'date-fns';

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
