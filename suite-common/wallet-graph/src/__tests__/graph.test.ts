/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

import {
    differenceInYears,
    subMinutes,
    isEqual,
    isBefore,
    getUnixTime,
    subSeconds,
} from 'date-fns';

import { testMocks } from '@suite-common/test-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils/libDev/src';
import TrezorConnect from '@trezor/connect';

import {
    calcFiatValueMap,
    sumFiatValueMapInPlace,
    accountGraphDataFilterFn,
    deviceGraphDataFilterFn,
    aggregateBalanceHistory,
    getValidGraphPoints,
    getLineGraphStepInMinutes,
    sortTimeFrameItemsByTimeAsc,
    getAxisLabelPercentagePosition,
    getExtremaFromGraphPoints,
    getSuccessAccountBalanceMovements,
    getLineGraphPoints,
    fetchAccountBalanceHistory,
    getTimestampsForFiatRatesInTimeFrame,
    getStartItemOfTimeFrame,
    mergeAndSortTimeFrameItems,
    minAndMaxGraphPointArrayItemIndex,
    sumLineGraphPoints,
    getFirstAccountBalanceMovement,
    processBalanceHistoryWithBalanceBefore,
    // getUniqueTimeFrameItemsWithSummaryBalance,
} from '../graphUtils';
import { getTimeFrameDataForSingleAccount } from '../graphThunks';
import { timeSwitchItems, lineGraphStepInMinutes } from '../config';
import {
    graphPointsWithInvalidValues,
    graphPointsWithZeroValues,
    MAX_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
    MIN_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
} from '../__fixtures__/graphPoints';
import { accountBalanceHistoryUsdRates } from '../__fixtures__/accountBalanceHistory';
import {
    timeFrameItemsWithBalanceAndUsdRates,
    timeFrameItemsWithBalanceAndUsdRatesWithExpectedValueWithExpectedValue,
} from '../__fixtures__/timeFrameItems';
import { LineGraphTimeFrameItemAccountBalance } from '../types';
import { accountNotEmptyFirstBalanceMovement } from '../__fixtures__/firstBalanceMovements';
import { timeFramesFixtures } from '../__fixtures__/timeFramesFixtures';
import { getMockedBlockBookRatesForTimestamps } from '../__fixtures__/blockbook';

jest.mock('@trezor/connect', () => {
    let fixture: { success: boolean; payload: string };

    return {
        ...jest.requireActual('@trezor/connect'),
        __esModule: true, // this property makes it work
        default: {
            blockchainGetAccountBalanceHistory: () =>
                new Promise(resolve => {
                    resolve(fixture);
                }),
        },
        setTestFixtures: (f: typeof fixture) => {
            fixture = f;
        },
    };
});

const { getWalletAccount } = testMocks;

const ratesETH = {
    symbol: 'eth',
    rates: {
        czk: 3007.1079886708517,
        eos: 36.852136278995445,
        eur: 117.13118845579191,
        gbp: 100.43721437661289,
        aaa: undefined,
    },
    timestamp: Date.now(),
} as const;

const valueMap1 = {
    czk: '100',
    aaa: undefined,
} as const;

const valueMap2 = {
    czk: '0.0001',
    eur: '0.000000000000001',
    aaa: undefined,
    b: undefined,
    c: '3',
} as const;

const account1Dev1 = getWalletAccount({
    descriptor: 'abc',
    symbol: 'btc',
    deviceState: 'abc123',
});

const account2Dev1 = getWalletAccount({
    descriptor: 'xyz',
    symbol: 'btc',
    deviceState: 'abc123',
});

const account1Dev2 = getWalletAccount({
    descriptor: 'abc',
    symbol: 'btc',
    deviceState: 'xyz123',
});

const graphData1 = {
    account: account1Dev1,
    error: false,
    isLoading: false,
    data: [],
};

const rates = {
    czk: 3007.1079886708517,
    eos: 36.852136278995445,
    eur: 117.13118845579191,
    gbp: 100.43721437661289,
    aaa: undefined,
};
const graphData2 = {
    account: account1Dev1,
    error: false,
    isLoading: false,
    data: [
        {
            balance: '0',
            time: 1561932000,
            txs: 14,
            received: '0.1',
            sent: '0.1',
            rates,
        },
        {
            balance: '-0.003',
            time: 1580511600,
            txs: 2,
            received: '0.2',
            sent: '0.23',
            rates,
        },
    ],
};
const graphData3 = {
    account: account2Dev1,
    error: false,
    isLoading: false,
    data: [
        {
            time: 1561932000,
            txs: 14,
            received: '1',
            sent: '1',
            rates,
        },
        {
            time: 1580511600,
            txs: 2,
            received: '1.2',
            sent: '1.2',
            rates,
        },
    ],
};

describe('Graph utils', () => {
    describe('getLineGraphAllTimeStepInMinutes', () => {
        const endOfRange = new Date();
        // all time could be anything...minutes, hours, days...
        test('should step 30 minutes back', () => {
            expect(getLineGraphStepInMinutes(endOfRange, 30)).toEqual(lineGraphStepInMinutes.hour);
        });
        test('should step one hour back', () => {
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.hour.valueBackInMinutes!),
            ).toEqual(lineGraphStepInMinutes.hour);
        });
        test('should step 3 hours back', () => {
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.hour.valueBackInMinutes! * 3),
            ).toEqual(lineGraphStepInMinutes.hour);
        });
        test('should step one day back', () => {
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.day.valueBackInMinutes!),
            ).toEqual(lineGraphStepInMinutes.day);
        });
        test('should step one week back', () => {
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.week.valueBackInMinutes!),
            ).toEqual(lineGraphStepInMinutes.week);
        });
        test('should step one month back', () => {
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.month.valueBackInMinutes!),
            ).toEqual(lineGraphStepInMinutes.month);
        });
        test('should step circa 2 months back', () => {
            expect(
                getLineGraphStepInMinutes(
                    endOfRange,
                    timeSwitchItems.month.valueBackInMinutes! * 2,
                ),
            ).toEqual(lineGraphStepInMinutes.month);
        });
        test('should step circa 10 months back', () => {
            expect(
                getLineGraphStepInMinutes(
                    endOfRange,
                    timeSwitchItems.month.valueBackInMinutes! * 10,
                ),
            ).toEqual(lineGraphStepInMinutes.year);
        });
        test('should step circa one year back', () => {
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.year.valueBackInMinutes!),
            ).toEqual(lineGraphStepInMinutes.year);
        });
        test('should step circa 4 years back', () => {
            const startOfRangeDate = subMinutes(
                endOfRange,
                timeSwitchItems.year.valueBackInMinutes! * 4,
            );
            const differenceYears = differenceInYears(endOfRange, startOfRangeDate);
            expect(
                getLineGraphStepInMinutes(endOfRange, timeSwitchItems.year.valueBackInMinutes! * 4),
            ).toEqual(lineGraphStepInMinutes.year * differenceYears);
        });
    });

    test('sortTimeFrameItemsByTimeAsc', () => {
        const shuffledArray = accountBalanceHistoryUsdRates.sort(() => 0.5 - Math.random());
        const sortedArray = sortTimeFrameItemsByTimeAsc(accountBalanceHistoryUsdRates);
        sortedArray.forEach((balanceItem, index) => {
            if (index > 0) {
                expect(balanceItem.time).toBeGreaterThanOrEqual(shuffledArray[index - 1].time);
            }
        });
    });

    describe('getSuccessAccountBalanceMovements', () => {
        test('Should return the same array as all movement items are valid', () => {
            const allSuccessAccountBalanceHistoryUsdRatesLength =
                accountBalanceHistoryUsdRates.length;
            accountBalanceHistoryUsdRates.forEach(movement =>
                expect(!Number.isNaN(movement?.time)).toBeTruthy(),
            );
            expect(getSuccessAccountBalanceMovements(accountBalanceHistoryUsdRates)).toHaveLength(
                allSuccessAccountBalanceHistoryUsdRatesLength,
            );
        });

        test('Should return empty array as all movement items are invalid', () => {
            const allInvalidAccountBalanceHistoryUsdRates: LineGraphTimeFrameItemAccountBalance[] =
                [];
            allInvalidAccountBalanceHistoryUsdRates.forEach(movement => {
                const time = movement?.time;
                expect(Number.isNaN(time)).toBeTruthy();
            });
            expect(
                getSuccessAccountBalanceMovements(allInvalidAccountBalanceHistoryUsdRates),
            ).toHaveLength(0);
        });
    });

    test('minAndMaxGraphPointArrayItemIndex', () => {
        const validGraphPoints = getValidGraphPoints(graphPointsWithInvalidValues);
        const maxValueInArrayIndex = validGraphPoints.findIndex(
            item => item.value === MAX_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
        );
        const minValueInArrayIndex = validGraphPoints.findIndex(
            item => item.value === MIN_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
        );
        const { maxIndex, minIndex } = minAndMaxGraphPointArrayItemIndex(validGraphPoints);
        expect(maxIndex).toBe(maxValueInArrayIndex);
        expect(minIndex).toBe(minValueInArrayIndex);
    });

    test('getAxisLabelPercentagePosition', () => {
        // items in array are indexed from 0
        const total = 299;
        const part = 2;
        const percentageOfTotal = 1; // 1 %
        expect(getAxisLabelPercentagePosition(part, total)).toBe(percentageOfTotal);
    });

    test('sumLineGraphPoints', () => {
        expect(sumLineGraphPoints(graphPointsWithZeroValues)).toBe(0);
    });

    test('getExtremaFromGraphPoints', () => {
        const validGraphPoints = getValidGraphPoints(graphPointsWithInvalidValues);
        const extremaFromPoints = getExtremaFromGraphPoints(validGraphPoints);
        const minValueInArrayIndex = validGraphPoints.findIndex(
            item => item.value === MIN_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
        );
        const maxValueInArrayIndex = validGraphPoints.findIndex(
            item => item.value === MAX_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
        );

        expect(extremaFromPoints?.max).toEqual({
            x: getAxisLabelPercentagePosition(maxValueInArrayIndex, validGraphPoints.length),
            value: MAX_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
        });
        expect(extremaFromPoints?.min).toEqual({
            x: getAxisLabelPercentagePosition(minValueInArrayIndex, validGraphPoints.length),
            value: MIN_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
        });
    });

    test('getUniqueTimeFrameItemsWithSummaryBalance', () => {});

    test('getLineGraphPointsWithFiatBalances', () => {
        const fixturesTimeFrameItemsWithExpectedValuesMappedToPoints =
            timeFrameItemsWithBalanceAndUsdRatesWithExpectedValueWithExpectedValue.map(
                timeFrameItem => ({
                    date: new Date(timeFrameItem.time * 1000),
                    value: timeFrameItem.expectedValue,
                }),
            );
        expect(getLineGraphPoints(timeFrameItemsWithBalanceAndUsdRates)).toEqual(
            fixturesTimeFrameItemsWithExpectedValuesMappedToPoints,
        );
    });

    describe('getValidGraphPoints', () => {
        test('should remove all invalid points', () => {
            const graphPointsWithNumericValues = graphPointsWithInvalidValues.filter(
                point => !Number.isNaN(point.value),
            );
            expect(getValidGraphPoints(graphPointsWithInvalidValues).length).toEqual(
                graphPointsWithNumericValues.length,
            );
            getValidGraphPoints(graphPointsWithInvalidValues).forEach(point =>
                expect(Number.isNaN(point.value)).toBeFalsy(),
            );
        });
        test('should dates follow each other from the start of unix epoch', () => {
            const validGraphPoints = getValidGraphPoints(graphPointsWithInvalidValues);
            validGraphPoints.forEach((point, index) => {
                if (index === 0) {
                    expect(point.date.getTime()).toEqual(0);
                } else {
                    const previousDateTime = validGraphPoints[index - 1].date.getTime();
                    expect(point.date.getTime()).toEqual(previousDateTime + 1);
                }
            });
        });
    });

    /*
    describe('POKUSY BEFORE', () => {
        test('should return expected graph points for the specified account in ALL time frame', async () => {
            const endOfRangeDate = new Date('2022-10-24T23:59:59.000Z');
            const allAccounts = [account1Dev1, account1Dev2];
            const differentNetworkSymbolAccountsMap =
                getDifferentNetworkSymbolAccountsMap(allAccounts);

            const uniqueTimeFrameItemsForDifferentNetworkAccountsPromises =
                getUniqueTimeFrameItemsForDifferentNetworkAccounts(
                    differentNetworkSymbolAccountsMap,
                    fiatCurrency,
                    timeFrame,
                );
            const uniqueTimeFrameItemsForDifferentNetworkAccounts = await Promise.all(
                uniqueTimeFrameItemsForDifferentNetworkAccountsPromises,
            );
        });
    });
     */

    describe('Get graph points for single account - mocked account with movements in 2 weeks before now (endOfRangeDate)', () => {
        Object.keys(timeFramesFixtures).forEach(fixtureTimeFrameItemKey => {
            // @ts-expect-error
            const fixture = timeFramesFixtures[fixtureTimeFrameItemKey];
            const { shortcut, value, stepInMinutes, valueBackInMinutes, connectMocks, results } =
                fixture;

            it(`should return expected graph points for the specified account in ${shortcut} time frame`, async () => {
                const endOfTimeFrameDate = new Date('2022-10-26T23:59:59.000Z');

                require('@trezor/connect').setTestFixtures(accountNotEmptyFirstBalanceMovement);
                const firstAccountBalanceMovement = await getFirstAccountBalanceMovement(
                    account1Dev1,
                );

                expect(firstAccountBalanceMovement.time).toEqual(
                    results.firstAccountBalanceMovement.time,
                );
                expect(firstAccountBalanceMovement.balance).toEqual(
                    results.firstAccountBalanceMovement.balance,
                );

                const { startOfTimeFrameDate, timestampDatesInTimeFrame } =
                    await getTimeFrameDataForSingleAccount(
                        endOfTimeFrameDate,
                        value,
                        firstAccountBalanceMovement,
                    );

                const timeFrameRatesMocked =
                    getMockedBlockBookRatesForTimestamps(timestampDatesInTimeFrame);

                const firstRate = await getStartItemOfTimeFrame(account1Dev1, startOfTimeFrameDate);

                require('@trezor/connect').setTestFixtures(
                    connectMocks.balanceMovementsInTimeFrameRatesBefore,
                );
                const balanceMovementsInTimeFrameRatesBefore = await fetchAccountBalanceHistory(
                    account1Dev1,
                    {
                        to: getBlockbookSafeTime(getUnixTime(subSeconds(startOfTimeFrameDate, 60))),
                        groupByInSeconds: 86400, // one day
                    },
                );

                require('@trezor/connect').setTestFixtures(
                    connectMocks.balanceMovementsInTimeFrameRates,
                );
                const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
                    coin: account1Dev1.symbol,
                    descriptor: account1Dev1.descriptor,
                    from: getBlockbookSafeTime(getUnixTime(startOfTimeFrameDate)),
                    to: getBlockbookSafeTime(getUnixTime(endOfTimeFrameDate)),
                    groupBy: 60,
                });

                expect(response?.success).toBeTruthy();

                if (response?.success) {
                    const balanceMovementsInTimeFrameRates =
                        await processBalanceHistoryWithBalanceBefore(
                            balanceMovementsInTimeFrameRatesBefore,
                            account1Dev1,
                            response.payload,
                        );

                    const allTimeFrameRatesWithBalances = mergeAndSortTimeFrameItems(
                        // 1. - The first point in chart - we need to know account balance at the beginning...
                        firstRate,
                        // 2. - We need to know about rates in selected time frame to have line based on current fiat rates - not to be static with one rate from the beginning
                        timeFrameRatesMocked,
                        // 3. movements in time frame
                        balanceMovementsInTimeFrameRates,
                        'usd',
                    );

                    const lineGraphPoints = getLineGraphPoints(allTimeFrameRatesWithBalances);

                    console.log('LINE GRAPH POINTS: ', lineGraphPoints);
                }
            });
        });
    });

    test('calcFiatValueMap', () => {
        expect(calcFiatValueMap('2', ratesETH.rates)).toStrictEqual({
            czk: '6014.22',
            eos: '73.70',
            eur: '234.26',
            gbp: '200.87',
            aaa: '0',
        });
    });

    test('sumFiatValueMap', () => {
        const valueMap1Copy = { ...valueMap1 };
        sumFiatValueMapInPlace(valueMap1Copy, valueMap2);
        expect(valueMap1Copy).toStrictEqual({
            czk: '100.0001',
            eur: '0.000000000000001',
            aaa: '0',
            b: '0',
            c: '3',
        });
    });

    test('accountGraphDataFilterFn', () => {
        expect(accountGraphDataFilterFn(graphData1, account1Dev1)).toBe(true);
        expect(accountGraphDataFilterFn(graphData1, account1Dev2)).toBe(false);
        expect(accountGraphDataFilterFn(graphData1, account2Dev1)).toBe(false);
    });

    test('accountGraphDataFilterFn', () => {
        expect(deviceGraphDataFilterFn(graphData1, account1Dev1.deviceState)).toBe(true);
        expect(deviceGraphDataFilterFn(graphData1, account1Dev2.deviceState)).toBe(false);
        expect(deviceGraphDataFilterFn(graphData1, account2Dev1.deviceState)).toBe(true);
    });

    test('aggregateBalanceHistory group by month', () => {
        expect(aggregateBalanceHistory([graphData1, graphData1], 'month', 'account')).toEqual([]);
        expect(aggregateBalanceHistory([graphData1, graphData2], 'month', 'account')).toEqual([
            {
                balance: '0',
                received: '0.1',
                receivedFiat: {
                    aaa: '0',
                    czk: '300.71',
                    eos: '3.69',
                    eur: '11.71',
                    gbp: '10.04',
                },
                sent: '0.1',
                sentFiat: {
                    aaa: '0',
                    czk: '300.71',
                    eos: '3.69',
                    eur: '11.71',
                    gbp: '10.04',
                },
                balanceFiat: {
                    aaa: '0',
                    czk: '0.00',
                    eos: '0.00',
                    eur: '0.00',
                    gbp: '0.00',
                },
                time: 1559347200,
                txs: 14,
            },
            {
                balance: '-0.003',
                received: '0.2',
                sent: '0.23',
                receivedFiat: {
                    aaa: '0',
                    czk: '601.42',
                    eos: '7.37',
                    eur: '23.43',
                    gbp: '20.09',
                },
                sentFiat: {
                    aaa: '0',
                    czk: '691.63',
                    eos: '8.48',
                    eur: '26.94',
                    gbp: '23.10',
                },
                balanceFiat: {
                    aaa: '0',
                    czk: '-9.02',
                    eos: '-0.11',
                    eur: '-0.35',
                    gbp: '-0.30',
                },
                time: 1577836800,
                txs: 2,
            },
        ]);
        // @ts-expect-error
        expect(aggregateBalanceHistory([graphData2, graphData3], 'day', 'account')).toEqual([
            {
                received: '1.1',
                sent: '1.1',
                receivedFiat: {
                    aaa: '0',
                    czk: '3307.82',
                    eos: '40.54',
                    eur: '128.84',
                    gbp: '110.48',
                },
                sentFiat: {
                    aaa: '0',
                    czk: '3307.82',
                    eos: '40.54',
                    eur: '128.84',
                    gbp: '110.48',
                },
                time: 1561932000,
                txs: 28,
                balance: '0',
                balanceFiat: {
                    aaa: '0',
                    czk: '0',
                    eos: '0',
                    eur: '0',
                    gbp: '0',
                },
            },
            {
                received: '1.4',
                sent: '1.43',
                receivedFiat: {
                    aaa: '0',
                    czk: '4209.95',
                    eos: '51.59',
                    eur: '163.99',
                    gbp: '140.61',
                },
                sentFiat: {
                    aaa: '0',
                    czk: '4300.16',
                    eos: '52.7',
                    eur: '167.5',
                    gbp: '143.62',
                },
                balance: '-0.003',
                balanceFiat: {
                    aaa: '0',
                    czk: '-9.02',
                    eos: '-0.11',
                    eur: '-0.35',
                    gbp: '-0.3',
                },
                time: 1580511600,
                txs: 4,
            },
        ]);
    });
});
