import { A, D, pipe } from '@mobily/ts-belt';
import BigNumber from 'bignumber.js';
import { differenceInMinutes, eachMinuteOfInterval, fromUnixTime, getUnixTime } from 'date-fns';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { FiatGraphPoint, FiatGraphPointWithCryptoBalance } from './types';

export const getDataStepInMinutes = ({
    startOfTimeFrameDate,
    endOfTimeFrameDate,
    numberOfPoints,
}: {
    startOfTimeFrameDate: Date;
    endOfTimeFrameDate: Date;
    numberOfPoints: number;
}): number => {
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

    // sometimes endOfRangeDate could be too close to recent time and that cause problems with blockbook
    const intervalEndDate = fromUnixTime(getBlockbookSafeTime(getUnixTime(endOfTimeFrameDate)));

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

export type AccountHistoryBalancePoint = {
    time: number;
    cryptoBalance: string;
};

export const mapCryptoBalanceMovementToFixedTimeFrame = ({
    balanceHistory,
    fiatRates,
    fiatCurrency,
}: {
    balanceHistory: AccountHistoryBalancePoint[];
    fiatRates: Array<{
        time: number;
        rates: {
            [key: string]: number | undefined;
        };
    }>;
    fiatCurrency: FiatCurrencyCode;
}): readonly FiatGraphPointWithCryptoBalance[] =>
    pipe(
        fiatRates,
        A.map(fiatRatePoint => {
            let cryptoBalance = new BigNumber('0');
            balanceHistory.forEach(accountBalancePoint => {
                if (accountBalancePoint.time <= fiatRatePoint.time) {
                    cryptoBalance = new BigNumber(accountBalancePoint.cryptoBalance);
                }
            });

            const fiatRate = fiatRatePoint.rates[fiatCurrency] ?? 0;

            return {
                timestamp: fiatRatePoint.time,
                cryptoBalance: cryptoBalance.toFixed(),
                fiatBalance: cryptoBalance.multipliedBy(fiatRate).toNumber(),
            };
        }),
    );

export const mergeMultipleFiatBalanceHistories = (
    fiatBalancesHistories: readonly (readonly FiatGraphPointWithCryptoBalance[])[],
): readonly FiatGraphPoint[] =>
    pipe(
        fiatBalancesHistories,
        A.flat,
        A.groupBy(fiatBalancePoint => fiatBalancePoint.timestamp),
        D.mapWithKey((timestamp, fiatBalancePoints) => {
            const fiatBalance = fiatBalancePoints
                ? A.reduce(
                      fiatBalancePoints,
                      0,
                      (acc, fiatBalancePoint) => acc + fiatBalancePoint.fiatBalance,
                  )
                : 0;
            return {
                // Shouldn't be necessary according to types but it is string in the end
                // TODO: fix types of @mobily/ts-belt https://github.com/mobily/ts-belt/issues/57
                timestamp: Number(timestamp),
                fiatBalance,
            };
        }),
        D.values,
    );

export type AccountWithBalanceHistory = {
    coin: NetworkSymbol;
    descriptor: string;
} & { balanceHistory: AccountHistoryBalancePoint[] };

export const findOldestBalanceMovementTimestamp = (
    accountsWithBalanceHistory: AccountWithBalanceHistory[],
): number => {
    const allTimestamps = accountsWithBalanceHistory
        .map(account => {
            const oldestBalanceMovement = account.balanceHistory;
            return oldestBalanceMovement ? oldestBalanceMovement.map(({ time }) => time) : 0;
        })
        .flatMap(timestamp => timestamp);

    return Math.min(...allTimestamps);
};
