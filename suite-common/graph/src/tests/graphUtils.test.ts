import { fromUnixTime } from 'date-fns';

import {
    findOldestBalanceMovementTimestamp,
    getDataStepInMinutes,
    mapCryptoBalanceMovementToFixedTimeFrame,
    mergeMultipleFiatBalanceHistories,
} from '../graphUtils';
import type {
    AccountHistoryBalancePoint,
    AccountWithBalanceHistory,
    FiatGraphPointWithCryptoBalance,
    FiatRatesItem,
} from '../types';

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
                symbol: 'btc',
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
                symbol: 'eth',
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
});
