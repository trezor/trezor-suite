import {
    AccountHistoryBalancePoint,
    AccountWithBalanceHistory,
    findOldestBalanceMovementTimestamp,
    getDataStepInMinutes,
    mapCryptoBalanceMovementToFixedTimeFrame,
    mergeMultipleFiatBalanceHistories,
} from '../graphUtils';
import { FiatGraphPointWithCryptoBalance } from '../types';

describe('Graph utils', () => {
    it('getDataStepInMinutes for 1 hour', () => {
        const stepInMinutes = getDataStepInMinutes({
            startOfTimeFrameDate: new Date(2022, 0, 1, 0),
            endOfTimeFrameDate: new Date(2022, 0, 1, 1),
            numberOfPoints: 60,
        });
        expect(stepInMinutes).toBe(1);
    });

    it('getDataStepInMinutes for 1 day', () => {
        const stepInMinutes = getDataStepInMinutes({
            startOfTimeFrameDate: new Date(2022, 0, 1),
            endOfTimeFrameDate: new Date(2022, 0, 2),
            numberOfPoints: 24,
        });
        expect(stepInMinutes).toBe(60);
    });

    it('getDataStepInMinutes for 1 year', () => {
        const stepInMinutes = getDataStepInMinutes({
            startOfTimeFrameDate: new Date(2021, 0, 1),
            endOfTimeFrameDate: new Date(2022, 0, 1),
            numberOfPoints: 364,
        });
        expect(stepInMinutes).toBe(1444);
    });

    it('mapCryptoBalanceMovementToFixedTimeFrame - evenly distributed values', () => {
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
        const fiatRates = [
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
                fiatCurrency: 'eur',
            }),
        ).toStrictEqual([
            {
                timestamp: 0,
                cryptoBalance: '1',
                fiatBalance: 2,
            },
            {
                timestamp: 5,
                cryptoBalance: '3',
                fiatBalance: 6,
            },
            {
                timestamp: 10,
                cryptoBalance: '8',
                fiatBalance: 24,
            },
            {
                timestamp: 15,
                cryptoBalance: '7',
                fiatBalance: 28,
            },
            {
                timestamp: 20,
                cryptoBalance: '10',
                fiatBalance: 20,
            },
        ] as FiatGraphPointWithCryptoBalance[]);
    });

    it('mapCryptoBalanceMovementToFixedTimeFrame - handles out of bounds values', () => {
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
                time: 3,
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
        const fiatRates = [
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
                fiatCurrency: 'eur',
            }),
        ).toStrictEqual([
            {
                timestamp: 0,
                cryptoBalance: '30',
                fiatBalance: 60,
            },
            {
                timestamp: 5,
                cryptoBalance: '3',
                fiatBalance: 6,
            },
            {
                timestamp: 10,
                cryptoBalance: '3',
                fiatBalance: 9,
            },
            {
                timestamp: 15,
                cryptoBalance: '3',
                fiatBalance: 12,
            },
            {
                timestamp: 20,
                cryptoBalance: '10',
                fiatBalance: 20,
            },
        ]);
    });

    it('mapCryptoBalanceMovementToFixedTimeFrame - account with no transactions', () => {
        const balanceHistory: AccountHistoryBalancePoint[] = [];
        const fiatRates = [
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
                fiatCurrency: 'eur',
            }),
        ).toStrictEqual(
            fiatRates.map(({ time }) => ({ timestamp: time, cryptoBalance: '0', fiatBalance: 0 })),
        );
    });

    it('mergeMultipleFiatBalanceHistories', () => {
        const fiatBalancesHistories: Array<FiatGraphPointWithCryptoBalance[]> = [
            [
                {
                    timestamp: 0,
                    cryptoBalance: '1',
                    fiatBalance: 2,
                },
                {
                    timestamp: 5,
                    cryptoBalance: '2',
                    fiatBalance: 6,
                },
            ],
            [
                {
                    timestamp: 0,
                    cryptoBalance: '3',
                    fiatBalance: 5,
                },
                {
                    timestamp: 5,
                    cryptoBalance: '4',
                    fiatBalance: 3,
                },
            ],
            [
                {
                    timestamp: 0,
                    cryptoBalance: '5',
                    fiatBalance: 1,
                },
                {
                    timestamp: 5,
                    cryptoBalance: '6',
                    fiatBalance: 1,
                },
            ],
        ];

        expect(mergeMultipleFiatBalanceHistories(fiatBalancesHistories)).toStrictEqual([
            {
                timestamp: 0,
                fiatBalance: 8,
            },
            {
                timestamp: 5,
                fiatBalance: 10,
            },
        ]);
    });

    it('findOldestBalanceMovementTimestamp', () => {
        const balanceHistory: AccountWithBalanceHistory[] = [
            {
                coin: 'btc',
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
                coin: 'ltc',
                descriptor: 'awdawd',
                balanceHistory: [
                    {
                        time: 3,
                        cryptoBalance: '3',
                    },
                    {
                        time: 13,
                        cryptoBalance: '4',
                    },
                ],
            },
            {
                coin: 'eth',
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
