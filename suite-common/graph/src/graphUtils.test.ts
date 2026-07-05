import { fromUnixTime } from 'date-fns';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TimestampedRates } from '@suite-common/wallet-types';

import {
    findOldestBalanceMovementTimestamp,
    getDataStepInMinutes,
    mapCryptoBalanceMovementToFixedTimeFrame,
    mapTickersToFiatRatesItems,
    mergeMultipleFiatBalanceHistories,
} from './graphUtils';
import type {
    AccountHistoryBalancePoint,
    AccountWithBalanceHistory,
    FiatGraphPointWithCryptoBalance,
    FiatRatesItem,
} from './types';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

describe(mapTickersToFiatRatesItems.name, () => {
    it('attaches the nearest rate to every requested timestamp when the tickers array is sparse and out of order', () => {
        // Blockbook drops tickers it has no rate for (compacting the array) and does not
        // guarantee response order matches the requested timestamps.
        const tickers: TimestampedRates[] = [
            { ts: 16, rates: { usd: 3 } },
            { ts: 0, rates: { usd: 1 } },
            { ts: 20, rates: { usd: 4 } },
            { ts: 9, rates: { usd: 2 } },
        ];

        expect(mapTickersToFiatRatesItems(tickers, [0, 5, 10, 15, 20])).toStrictEqual([
            { time: 0, rates: { usd: 1 } },
            { time: 5, rates: { usd: 2 } },
            { time: 10, rates: { usd: 2 } },
            { time: 15, rates: { usd: 3 } },
            { time: 20, rates: { usd: 4 } },
        ] as FiatRatesItem[]);
    });

    it('keeps every coin on the requested timestamp grid so merged accounts sum values instead of interleaving them', () => {
        // Tokens only have daily rate history while native coins have hourly rates — points keyed
        // by the ticker `ts` would land on different grids per coin, and the merge sums only
        // points with equal timestamps.
        const dailyTokenTickers: TimestampedRates[] = [
            { ts: 0, rates: { usd: 1 } },
            { ts: 86400, rates: { usd: 2 } },
        ];

        expect(
            mapTickersToFiatRatesItems(dailyTokenTickers, [0, 21600, 43200, 64800, 86400]),
        ).toStrictEqual([
            { time: 0, rates: { usd: 1 } },
            { time: 21600, rates: { usd: 1 } },
            { time: 43200, rates: { usd: 2 } },
            { time: 64800, rates: { usd: 2 } },
            { time: 86400, rates: { usd: 2 } },
        ] as FiatRatesItem[]);
    });

    it('collapses the frame-end timestamp requested twice so merged accounts do not double the last point (regression for issue #20785)', () => {
        // The frame end is appended to the requested timestamps and eachMinuteOfInterval emits it
        // too whenever the time frame length divides evenly by the point step.
        const tickers: TimestampedRates[] = [
            { ts: 0, rates: { usd: 1 } },
            { ts: 10, rates: { usd: 2 } },
            { ts: 20, rates: { usd: 4 } },
        ];

        expect(mapTickersToFiatRatesItems(tickers, [0, 10, 20, 20])).toStrictEqual([
            { time: 0, rates: { usd: 1 } },
            { time: 10, rates: { usd: 2 } },
            { time: 20, rates: { usd: 4 } },
        ] as FiatRatesItem[]);
    });

    it('returns an empty array when blockbook has no rates at all', () => {
        expect(mapTickersToFiatRatesItems([], [0, 10, 20])).toStrictEqual([]);
    });

    it('produces rates that yield varying graph values for a flat crypto balance (regression for issue #17671)', () => {
        // Requested timestamps were [0, 5, 10, 15, 20], but the ticker for 5 was dropped.
        // Mapping tickers positionally onto the requested timestamps would shift every
        // following rate to an earlier, incorrect date and drop the most recent timestamp (20)
        // entirely, making token graphs appear flat.
        const tickers: TimestampedRates[] = [
            { ts: 15, rates: { usd: 3 } },
            { ts: 0, rates: { usd: 1 } },
            { ts: 20, rates: { usd: 4 } },
            { ts: 10, rates: { usd: 2 } },
        ];
        const balanceHistory: AccountHistoryBalancePoint[] = [{ time: 100, cryptoBalance: '100' }];

        const fiatRates = mapTickersToFiatRatesItems(tickers, [0, 5, 10, 15, 20]);
        const result = mapCryptoBalanceMovementToFixedTimeFrame({
            balanceHistory,
            fiatRates,
            baseCurrencyCode: 'usd',
        });

        expect(result).toStrictEqual([
            { date: fromUnixTime(0), cryptoBalance: '100', value: 100 },
            { date: fromUnixTime(5), cryptoBalance: '100', value: 200 },
            { date: fromUnixTime(10), cryptoBalance: '100', value: 200 },
            { date: fromUnixTime(15), cryptoBalance: '100', value: 300 },
            { date: fromUnixTime(20), cryptoBalance: '100', value: 400 },
        ] as FiatGraphPointWithCryptoBalance[]);
    });
});

describe(getDataStepInMinutes.name, () => {
    it('gets the 1m step size for 1 hour interval (60 points)', () => {
        const stepInMinutes = getDataStepInMinutes({
            startOfTimeFrameDate: new Date(2022, 0, 1, 0),
            endOfTimeFrameDate: new Date(2022, 0, 1, 1),
            numberOfPoints: 60,
        });
        expect(stepInMinutes).toBe(1);
    });

    it('gets the 1h step size for 1 day interval (24points)', () => {
        const stepInMinutes = getDataStepInMinutes({
            startOfTimeFrameDate: new Date(2022, 0, 1),
            endOfTimeFrameDate: new Date(2022, 0, 2),
            numberOfPoints: 24,
        });
        expect(stepInMinutes).toBe(60);
    });

    it('gets the weird step size for 1 year interval (364, intentionally! points)', () => {
        const stepInMinutes = getDataStepInMinutes({
            startOfTimeFrameDate: new Date(2021, 0, 1),
            endOfTimeFrameDate: new Date(2022, 0, 1),
            numberOfPoints: 364,
        });
        expect(stepInMinutes).toBe(1444);
    });
});

describe(mapCryptoBalanceMovementToFixedTimeFrame.name, () => {
    it('maps evenly distributed values with different rates', () => {
        const balanceHistory = [
            {
                time: 0,
                cryptoBalance: '1',
            },
            {
                time: 2,
                cryptoBalance: '2',
            },
            {
                time: 3,
                cryptoBalance: '3',
            },
            {
                time: 6,
                cryptoBalance: '5',
            },
            {
                time: 10,
                cryptoBalance: '8',
            },
            {
                time: 13,
                cryptoBalance: '7',
            },
            {
                time: 17,
                cryptoBalance: '7',
            },
            {
                time: 20,
                cryptoBalance: '10',
            },
        ];
        const fiatRates: FiatRatesItem[] = [
            {
                time: 0,
                rates: {
                    eur: 2,
                },
            },
            {
                time: 5,
                rates: {
                    eur: 2,
                },
            },
            {
                time: 10,
                rates: {
                    eur: 3,
                },
            },
            {
                time: 15,
                rates: {
                    eur: 4,
                },
            },
            {
                time: 20,
                rates: {
                    eur: 2,
                },
            },
        ];
        expect(
            mapCryptoBalanceMovementToFixedTimeFrame({
                balanceHistory,
                fiatRates,
                baseCurrencyCode: 'eur',
            }),
        ).toStrictEqual([
            {
                date: fromUnixTime(0),
                cryptoBalance: '1',
                value: 2,
            },
            {
                date: fromUnixTime(5),
                cryptoBalance: '5',
                value: 10,
            },
            {
                date: fromUnixTime(10),
                cryptoBalance: '8',
                value: 24,
            },
            {
                date: fromUnixTime(15),
                cryptoBalance: '7',
                value: 28,
            },
            {
                date: fromUnixTime(20),
                cryptoBalance: '10',
                value: 20,
            },
        ] as FiatGraphPointWithCryptoBalance[]);
    });

    it('handles out of bounds values', () => {
        const balanceHistory: AccountHistoryBalancePoint[] = [
            {
                time: -20,
                cryptoBalance: '100',
            },
            {
                time: -10,
                cryptoBalance: '30',
            },
            {
                time: 5,
                cryptoBalance: '3',
            },
            {
                time: 17,
                cryptoBalance: '7',
            },
            {
                time: 20,
                cryptoBalance: '10',
            },
            {
                time: 25,
                cryptoBalance: '40',
            },
            {
                time: 30,
                cryptoBalance: '50',
            },
        ];
        const fiatRates: FiatRatesItem[] = [
            {
                time: 0,
                rates: {
                    eur: 2,
                },
            },
            {
                time: 5,
                rates: {
                    eur: 2,
                },
            },
            {
                time: 10,
                rates: {
                    eur: 3,
                },
            },
            {
                time: 15,
                rates: {
                    eur: 4,
                },
            },
            {
                time: 20,
                rates: {
                    eur: 2,
                },
            },
        ];
        expect(
            mapCryptoBalanceMovementToFixedTimeFrame({
                balanceHistory,
                fiatRates,
                baseCurrencyCode: 'eur',
            }),
        ).toStrictEqual([
            {
                date: fromUnixTime(0),
                cryptoBalance: '3',
                value: 6,
            },
            {
                date: fromUnixTime(5),
                cryptoBalance: '3',
                value: 6,
            },
            {
                date: fromUnixTime(10),
                cryptoBalance: '7',
                value: 21,
            },
            {
                date: fromUnixTime(15),
                cryptoBalance: '7',
                value: 28,
            },
            {
                date: fromUnixTime(20),
                cryptoBalance: '10',
                value: 20,
            },
        ]);
    });

    it('sums data from the account with no transactions as 0', () => {
        const balanceHistory: AccountHistoryBalancePoint[] = [];
        const fiatRates: FiatRatesItem[] = [
            {
                time: 0,
                rates: {
                    eur: 2,
                },
            },
            {
                time: 5,
                rates: {
                    eur: 2,
                },
            },
            {
                time: 10,
                rates: {
                    eur: 3,
                },
            },
            {
                time: 15,
                rates: {
                    eur: 4,
                },
            },
            {
                time: 20,
                rates: {
                    eur: 2,
                },
            },
        ];
        expect(
            mapCryptoBalanceMovementToFixedTimeFrame({
                balanceHistory,
                fiatRates,
                baseCurrencyCode: 'eur',
            }),
        ).toStrictEqual(
            fiatRates.map(({ time }) => ({
                date: fromUnixTime(time),
                cryptoBalance: '0',
                value: 0,
            })),
        );
    });
});

describe(mergeMultipleFiatBalanceHistories.name, () => {
    it('merges correctly BaseCurrency values by the date (timestamp) into time-buckets', () => {
        const fiatBalancesHistories: Array<FiatGraphPointWithCryptoBalance[]> = [
            [
                {
                    date: fromUnixTime(0),
                    cryptoBalance: '1',
                    value: 2,
                },
                {
                    date: fromUnixTime(5),
                    cryptoBalance: '2',
                    value: 6,
                },
            ],
            [
                {
                    date: fromUnixTime(0),
                    cryptoBalance: '3',
                    value: 5,
                },
                {
                    date: fromUnixTime(5),
                    cryptoBalance: '4',
                    value: 3,
                },
            ],
            [
                {
                    date: fromUnixTime(0),
                    cryptoBalance: '5',
                    value: 1,
                },
                {
                    date: fromUnixTime(5),
                    cryptoBalance: '6',
                    value: 1,
                },
            ],
        ];

        expect(mergeMultipleFiatBalanceHistories(fiatBalancesHistories)).toStrictEqual([
            {
                date: fromUnixTime(0),
                value: 8, // = 2 + 5 + 1
            },
            {
                date: fromUnixTime(5),
                value: 10, // = 1 + 4 + 6
            },
        ]);
    });
});

describe(findOldestBalanceMovementTimestamp.name, () => {
    it('finds the oldest balance movement', () => {
        const balanceHistory: AccountWithBalanceHistory[] = [
            {
                symbol: btcSymbol,
                descriptor: 'awdawd',
                balanceHistory: [
                    {
                        time: 20,
                        cryptoBalance: '1',
                    },
                    {
                        time: 50,
                        cryptoBalance: '2',
                    },
                ],
            },
            {
                symbol: ethSymbol,
                descriptor: 'awdawd',
                balanceHistory: [
                    {
                        time: 2,
                        cryptoBalance: '5',
                    },
                    {
                        time: 10,
                        cryptoBalance: '6',
                    },
                ],
            },
        ];

        expect(findOldestBalanceMovementTimestamp(balanceHistory)).toBe(2);
    });

    it('returns a non-finite value when there are no balance movements at all', () => {
        // Math.min of an empty list is Infinity; callers must guard for it (fromUnixTime(Infinity)
        // is an Invalid Date) rather than assume a real timestamp is returned.
        const noMovements: AccountWithBalanceHistory[] = [
            { symbol: btcSymbol, descriptor: 'awdawd', balanceHistory: [] },
            { symbol: ethSymbol, descriptor: 'awdawd', balanceHistory: [] },
        ];

        expect(Number.isFinite(findOldestBalanceMovementTimestamp(noMovements))).toBe(false);
        expect(Number.isFinite(findOldestBalanceMovementTimestamp([]))).toBe(false);
    });
});
