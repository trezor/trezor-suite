import BigNumber from 'bignumber.js';
import {
    startOfMonth,
    getUnixTime,
    fromUnixTime,
    differenceInMonths,
    subMinutes,
    differenceInDays,
    differenceInYears,
    isBefore,
    isAfter,
    isEqual,
    eachMinuteOfInterval,
} from 'date-fns';

import { CoinFiatRates, Account } from '@suite-common/wallet-types';
import type { BlockchainAccountBalanceHistory } from '@trezor/connect';
import { getBlockbookSafeTime, resetTime } from '@suite-common/suite-utils';
import { getFiatRatesForTimestamps, getTickerConfig } from '@suite-common/fiat-services';
import { toFiatCurrency, formatNetworkAmount } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config/libDev/src';
import TrezorConnect from '@trezor/connect';
import { AccountBalanceHistory } from '@trezor/blockchain-link';

import { lineGraphStepInMinutes, timeSwitchItems } from './config';
import {
    AggregatedDashboardHistory,
    AggregatedAccountHistory,
    GraphRange,
    GraphData,
    CommonAggregatedHistory,
    GraphScale,
    LineGraphTimeFrameItemAccountBalance,
    LineGraphTimeFrameValues,
    LineGraphPoint,
    LineGraphTimeFrameIntervalPoint,
} from './types';

type FiatRates = NonNullable<CoinFiatRates['current']>['rates'];

type TypeName = 'account' | 'dashboard';
type ObjectType<T> = T extends 'account'
    ? AggregatedAccountHistory
    : T extends 'dashboard'
    ? AggregatedDashboardHistory
    : never;

export const isAccountAggregatedHistory = (
    history: AggregatedAccountHistory | AggregatedDashboardHistory,
    type: 'account' | 'dashboard',
): history is AggregatedAccountHistory =>
    (history as AggregatedAccountHistory).sent !== undefined && type === 'account';

export const calcFiatValueMap = (
    amount: string,
    rates: FiatRates,
): { [k: string]: string | undefined } => {
    const fiatValueMap: { [k: string]: string | undefined } = {};
    Object.keys(rates).forEach(fiatSymbol => {
        fiatValueMap[fiatSymbol] = toFiatCurrency(amount, fiatSymbol, rates) ?? '0';
    });
    return fiatValueMap;
};

/**
 * Mutates the first object param and adds values from second object.
 *
 * @param {{ string: string | undefined }} valueMap
 * @param {{ string: string | undefined }} obj
 * @returns
 */
export const sumFiatValueMapInPlace = (
    valueMap: { [k: string]: string | undefined },
    obj: { [k: string]: string | undefined },
) => {
    Object.entries(obj).forEach(keyVal => {
        const [key, val] = keyVal;
        const previousValue = valueMap[key] ?? '0';
        valueMap[key] = new BigNumber(previousValue).plus(val ?? 0).toFixed();
    });
};

export const sumFiatValueMap = (
    valueMap: { [k: string]: string | undefined },
    obj: { [k: string]: string | undefined },
) => {
    const newMap = { ...valueMap };
    sumFiatValueMapInPlace(newMap, obj);
    return newMap;
};

// Used for dashboard graph, functionality currently disabled
// export const subFiatValueMap = (
//     valueMap: { [k: string]: string | undefined },
//     obj: { [k: string]: string | undefined },
// ) => {
//     const newMap = { ...valueMap };
//     Object.entries(obj).forEach(keyVal => {
//         const [key, val] = keyVal;
//         const previousValue = newMap[key] ?? '0';
//         newMap[key] = new BigNumber(previousValue).minus(val ?? 0).toFixed();
//     });
//     return newMap;
// };

/**
 * Return array with 2 items, minimum non-zero value and maximum value calculated from sent, received and balance fields
 */
export const getMinMaxValueFromData = <TType extends TypeName>(
    data: ObjectType<TType>[],
    _type: TType,
    extractSentValue: (sourceData: ObjectType<TType>) => string | undefined,
    extractReceivedValue: (sourceData: ObjectType<TType>) => string | undefined,
    extractBalanceValue: (sourceData: ObjectType<TType>) => string | undefined,
): [number, number] => {
    if (!data || data.length === 0) {
        return [0, 0];
    }
    let maxSent = new BigNumber(extractSentValue(data[0]) || 0);
    let maxReceived = new BigNumber(extractReceivedValue(data[0]) || 0);
    let maxBalance = new BigNumber(extractBalanceValue(data[0]) || 0);

    let minSent: BigNumber | undefined;
    let minReceived: BigNumber | undefined;
    let minBalance: BigNumber | undefined;

    data.forEach(d => {
        const newSentValue = new BigNumber(extractSentValue(d) || 0);
        const newReceivedValue = new BigNumber(extractReceivedValue(d) || 0);
        const newBalanceValue = new BigNumber(extractBalanceValue(d) || 0);

        // max value
        if (newSentValue.gt(maxSent)) {
            maxSent = newSentValue;
        }
        if (newReceivedValue.gt(maxReceived)) {
            maxReceived = newReceivedValue;
        }
        if (newBalanceValue.gt(maxBalance)) {
            maxBalance = newBalanceValue;
        }

        // min non zero value
        if ((minSent === undefined || newSentValue.lt(minSent)) && newSentValue.gt(0)) {
            minSent = newSentValue;
        }
        if (
            (minReceived === undefined || newReceivedValue.lt(minReceived)) &&
            newReceivedValue.gt(0)
        ) {
            minReceived = newReceivedValue;
        }
        if ((minBalance === undefined || newBalanceValue.lt(minBalance)) && newBalanceValue.gt(0)) {
            minBalance = newBalanceValue;
        }
    });

    const maxValue = Math.max(maxSent.toNumber(), maxReceived.toNumber(), maxBalance.toNumber());

    const minsToCompare = [minSent, minReceived, minBalance]
        .filter(m => !!m)
        .map(m => m!.toNumber());
    const minValue = Math.min(...minsToCompare);
    return [minValue, maxValue];
};

export const aggregateBalanceHistory = <TType extends TypeName>(
    graphData: GraphData[],
    groupBy: 'day' | 'month',
    type: TType,
): ObjectType<TType>[] => {
    const groupedByTimestamp: { [key: string]: ObjectType<TType> } = {};

    for (let i = 0; i < graphData.length; i++) {
        // graph data for one account
        const accountHistory = graphData[i].data;

        if (accountHistory && accountHistory.length > 0) {
            accountHistory.forEach(h => {
                // calc sent/received amounts in fiat
                const dataPoint = {
                    ...h,
                    receivedFiat: calcFiatValueMap(h.received, h.rates || {}),
                    sentFiat: calcFiatValueMap(h.sent, h.rates || {}),
                    balanceFiat: calcFiatValueMap(h.balance, h.rates || {}),
                };

                const d = fromUnixTime(dataPoint.time);
                // build string used as a key to index daily/monthly bins
                const key =
                    groupBy === 'day'
                        ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
                        : `${d.getFullYear()}-${d.getMonth() + 1}`;
                // current working bin
                const bin = groupedByTimestamp[key];

                // Calculate aggregated values for the bin
                if (!bin) {
                    // bin is empty, set initial values
                    const baseProps: AggregatedDashboardHistory = {
                        time:
                            groupBy === 'day'
                                ? dataPoint.time
                                : getUnixTime(startOfMonth(fromUnixTime(dataPoint.time))), // set timestamp to first day of the month
                        txs: dataPoint.txs,
                        balanceFiat: dataPoint.balanceFiat,
                        sentFiat: dataPoint.sentFiat,
                        receivedFiat: dataPoint.receivedFiat,
                        balance: undefined,
                        sent: undefined,
                        received: undefined,
                    };

                    const accountProps: AggregatedAccountHistory = {
                        ...baseProps,
                        balance: dataPoint.balance,
                        sent: dataPoint.sent,
                        received: dataPoint.received,
                    };

                    groupedByTimestamp[key] = (
                        type === 'account' ? accountProps : baseProps
                    ) as ObjectType<TType>;
                } else {
                    // add to existing bin
                    bin.txs += dataPoint.txs;
                    sumFiatValueMapInPlace(bin.sentFiat, dataPoint.sentFiat);
                    sumFiatValueMapInPlace(bin.receivedFiat, dataPoint.receivedFiat);
                    sumFiatValueMapInPlace(bin.balanceFiat, dataPoint.balanceFiat);

                    // sumFiatValueMap(
                    //     subFiatValueMap(bin.balanceFiat, dataPoint.sentFiat),
                    //     dataPoint.sentFiat,
                    // );

                    if (isAccountAggregatedHistory(bin, type)) {
                        // adding sent/received values
                        bin.balance = new BigNumber(bin.balance)
                            .plus(dataPoint.received)
                            .minus(dataPoint.sent)
                            .toFixed();
                        bin.sent = new BigNumber(bin.sent).plus(dataPoint.sent).toFixed();
                        bin.received = new BigNumber(bin.received)
                            .plus(dataPoint.received)
                            .toFixed();
                    }
                }
            });
        }
    }

    // convert bins from an object indexed by timestamp to an array of bins
    const aggregatedData = Object.keys(groupedByTimestamp)
        .map(timestamp => groupedByTimestamp[timestamp])
        .sort((a, b) => Number(a.time) - Number(b.time)); // sort from older to newer;;
    return aggregatedData;
};

export const accountGraphDataFilterFn = (d: GraphData, account: Account) =>
    d.account.descriptor === account.descriptor &&
    d.account.symbol === account.symbol &&
    d.account.deviceState === account.deviceState;

export const deviceGraphDataFilterFn = (d: GraphData, deviceState: string | undefined) => {
    if (!deviceState) return false;
    return d.account.deviceState === deviceState;
};

const calcMinYDomain = (minMaxValues: [number, number]) => {
    // Used in calculating domain interval for Y axis with log scale
    // We could simply use minimum coin value (eg 0.00000001) as our minimum, but that would results in
    // Y axis with values/labels 0.00000001, 0.0000001, 0.000001, 0.0001...
    // So instead we calculate what smallest value we need to show without any value being of of the range.
    // Maybe we could instead just calculate our own set of ticks
    const [minDataValue] = minMaxValues;
    const decimals = minDataValue.toString().split('.')[1]?.length;
    const min = decimals && decimals > 0 ? 1 / 10 ** decimals : 0.00000001;
    return min;
    // return 0.00000001;
};

export const calcYDomain = (
    type: 'fiat' | 'crypto',
    scale: GraphScale,
    minMaxValues: [number, number],
    lastBalance?: string,
): [number, number] => {
    const [, maxDataValue] = minMaxValues;
    const maxValueMultiplier = scale === 'linear' ? 1.2 : 10;

    let minValue: number;
    if (scale === 'linear') {
        minValue = 0;
    } else {
        minValue = type === 'fiat' ? 0.01 : calcMinYDomain(minMaxValues);
    }

    if (maxDataValue > 0) {
        return [minValue, maxDataValue * maxValueMultiplier];
    }

    // no txs, but there could be non zero balance we still need to show
    const lastBalanceBn = lastBalance ? new BigNumber(lastBalance) : null;
    if (lastBalanceBn && lastBalanceBn.gt(0)) {
        return [minValue, lastBalanceBn.toNumber() * 1.2];
    }

    // got maxValue === 0, zero balance
    // We basically don't handle the value of tokens txs.
    // They'll create dataPoints for the graph, but the sent/received amounts are always 0
    // This make sure we show nice fake y axis in cases in which there are only tokens txs.
    // Second usecase is on the dashboard when someone picks a range in which there are no txs
    return [minValue, 10 * maxValueMultiplier];
};

export const calcXDomain = (
    ticks: number[],
    data: { time: number }[],
    range: GraphRange,
): [number, number] => {
    const start = ticks[0];
    const lastTick = ticks[ticks.length - 1];
    const lastData = data[data.length - 1];
    // if the last data point is after last tick/label use datapoint's timestamp to mark the end of the interval
    const end = lastData && lastTick < lastData.time ? lastData.time : lastTick;

    let xPadding;
    switch (range.label) {
        case 'all':
            xPadding = 3600 * 24 * 30; // 30 days
            break;
        case 'year':
            xPadding = 3600 * 24 * 14; // 14 days
            break;
        case 'month':
        case 'day':
            xPadding = 3600 * 24; // 1 day
            break;
        case 'range':
            if (differenceInMonths(range.endDate, range.startDate) <= 1) {
                xPadding = 3600 * 24; // 1 day
            } else {
                xPadding = 3600 * 24 * 14; // 14 days
            }
            break;
        default: // 12 hours
            xPadding = 3600 * 12;
            break;
    }

    return [start - xPadding, end + xPadding];
};

export const calcFakeGraphDataForTimestamps = (
    timestamps: number[],
    data: CommonAggregatedHistory[],
    currentBalance?: string,
) => {
    const balanceData: CommonAggregatedHistory[] = [];
    const firstDataPoint = data[0];
    const lastDataPoint = data[data.length - 1];

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    if (data.length === 0) {
        timestamps.forEach(ts => {
            balanceData.push({
                time: ts,
                sent: '0',
                received: '0',
                sentFiat: {},
                receivedFiat: {},
                balanceFiat: {},
                txs: 0,
                balance: currentBalance,
            });
        });
        return balanceData;
    }

    if (firstDataPoint && lastDataPoint && firstTimestamp && lastTimestamp) {
        // fake points before first tx
        timestamps.forEach(ts => {
            if (ts < firstDataPoint.time) {
                balanceData.push({
                    time: ts,
                    sent: '0',
                    received: '0',
                    sentFiat: {},
                    receivedFiat: {},
                    balanceFiat: {},
                    txs: 0,
                    balance: firstDataPoint.balance
                        ? new BigNumber(firstDataPoint.balance)
                              .plus(firstDataPoint.sent ?? 0)
                              .minus(firstDataPoint.received ?? 0)
                              .toFixed()
                        : undefined,
                });
            }
        });

        // real data points with txs
        balanceData.push(...data);

        // points for days with no transactions that are between first and last tx
        timestamps.forEach(ts => {
            if (
                ts > firstDataPoint.time &&
                ts < lastDataPoint.time &&
                !data.find(d => d.time === ts)
            ) {
                const closest = data.findIndex(d => d.time >= ts);
                balanceData.push({
                    time: ts,
                    sent: '0',
                    received: '0',
                    sentFiat: {},
                    receivedFiat: {},
                    balanceFiat: {},
                    txs: 0,
                    balance: data[closest - 1]?.balance ?? '0',
                });
            }
        });

        // fake points after last tx
        timestamps.forEach(ts => {
            if (ts > lastDataPoint.time) {
                balanceData.push({
                    time: ts,
                    sent: '0',
                    received: '0',
                    sentFiat: {},
                    receivedFiat: {},
                    balanceFiat: {},
                    txs: 0,
                    balance: lastDataPoint.balance,
                });
            }
        });
    }

    const sortedData = balanceData.sort((a, b) => Number(a.time) - Number(b.time));

    return sortedData;
};

export const getFiatRatesForNetworkInTimeFrame = async (
    datesInRangeUnixTimeSet: number[],
    account: Account,
) => {
    const { symbol, descriptor } = account;
    const fiatRatesForDatesInRange = await getFiatRatesForTimestamps(
        { symbol },
        Array.from(datesInRangeUnixTimeSet),
    ).then(res =>
        (res?.tickers || []).map(({ ts, rates }) => ({
            time: ts,
            rates,
            descriptor,
        })),
    );
    return fiatRatesForDatesInRange;
};

export const sortTimeFrameItemsByTimeAsc = (
    accountBalanceMovements: LineGraphTimeFrameItemAccountBalance[],
) => accountBalanceMovements.sort((a, b) => a.time - b.time);

/**
 * It is not necessary to have items that are contained in other arrays with real balances.
 * Or earlier than preparedStartOfTimeFrameItem
 */
export const filterNotNecessaryTimeFrameRates = (
    preparedStartOfTimeFrameItem: LineGraphTimeFrameItemAccountBalance,
    timeFrameRates: LineGraphTimeFrameItemAccountBalance[],
    balanceMovementsInTimeFrameRates: LineGraphTimeFrameItemAccountBalance[],
) => {
    const accountBalancesTimestamps = balanceMovementsInTimeFrameRates.map(item => item.time);
    accountBalancesTimestamps.unshift(preparedStartOfTimeFrameItem.time);

    return timeFrameRates
        .filter(rateItem =>
            isAfter(
                new Date(rateItem.time * 1000),
                new Date(preparedStartOfTimeFrameItem.time * 1000),
            ),
        )
        .filter(rateItem => !accountBalancesTimestamps.includes(rateItem.time));
};

export const prepareStartOfTimeFrame = (
    startOfTimeFrameRate: LineGraphTimeFrameItemAccountBalance | null,
    startOfTimeFrameDate: Date,
    timeFrameRates: LineGraphTimeFrameItemAccountBalance[],
    balanceMovementsInTimeFrameRates: LineGraphTimeFrameItemAccountBalance[],
    fiatCurrency: FiatCurrencyCode,
    account: Account,
): LineGraphTimeFrameItemAccountBalance => {
    /*
     * account balance at the beginning of time frame has to be the first array item and should have the rate
     * of the earlier one from the balanceMovementsInTimeFrameRates and timeFrameRates
     */
    const firstTimeFrameRate = timeFrameRates[0];
    const firstFiatCurrencyRateFromTimeFrameRates = firstTimeFrameRate.time;
    const firstFiatCurrencyRateFromTimeFrameBalanceHistory =
        balanceMovementsInTimeFrameRates?.[0]?.time || Number.MAX_SAFE_INTEGER;

    const startOfTimeFrameFiatCurrencyRate = Math.min(
        firstFiatCurrencyRateFromTimeFrameRates,
        firstFiatCurrencyRateFromTimeFrameBalanceHistory,
    );

    let startOfTimeFrameData;

    // first timeFrameRates item is earlier than first account balance movement in time frame
    if (startOfTimeFrameFiatCurrencyRate === firstFiatCurrencyRateFromTimeFrameRates) {
        startOfTimeFrameData = {
            time: firstTimeFrameRate.time,
            rates: firstTimeFrameRate.rates,
            fiatCurrencyRate: firstTimeFrameRate.rates[fiatCurrency],
        };
    } else {
        startOfTimeFrameData = {
            time: balanceMovementsInTimeFrameRates[0].time,
            rates: balanceMovementsInTimeFrameRates[0].rates,
            fiatCurrencyRate: balanceMovementsInTimeFrameRates[0].rates[fiatCurrency],
        };
    }

    const startItem = startOfTimeFrameRate
        ? {
              ...startOfTimeFrameRate,
              time: getUnixTime(startOfTimeFrameDate),
              fiatCurrencyRate: startOfTimeFrameData.fiatCurrencyRate,
          }
        : startOfTimeFrameData;

    return {
        ...startItem,
        source: 'BalanceAtStartOfRange',
        descriptor: account.descriptor,
    };
};

export const mergeAndSortTimeFrameItems = (
    startOfTimeFrameRate: LineGraphTimeFrameItemAccountBalance | null,
    startOfTimeFrameDate: Date,
    timeFrameRates: LineGraphTimeFrameItemAccountBalance[],
    balanceMovementsInTimeFrameRates: LineGraphTimeFrameItemAccountBalance[],
    fiatCurrency: FiatCurrencyCode,
    account: Account,
) => {
    const preparedStartOfTimeFrameItem = prepareStartOfTimeFrame(
        startOfTimeFrameRate,
        startOfTimeFrameDate,
        timeFrameRates,
        balanceMovementsInTimeFrameRates,
        fiatCurrency,
        account,
    );

    const preparedFiatRatesForTimeFrame = filterNotNecessaryTimeFrameRates(
        preparedStartOfTimeFrameItem,
        timeFrameRates,
        balanceMovementsInTimeFrameRates,
    );

    const fiatRatesInTime: LineGraphTimeFrameItemAccountBalance[] = [
        ...balanceMovementsInTimeFrameRates.map(balanceHistoryInRange => ({
            ...balanceHistoryInRange,
            fiatCurrencyRate: balanceHistoryInRange.rates[fiatCurrency],
            source: 'BalanceHistoryInRange',
        })),
        ...preparedFiatRatesForTimeFrame.map(timeInRange => ({
            ...timeInRange,
            balance: undefined,
            fiatCurrencyRate: timeInRange.rates[fiatCurrency],
            source: 'FiatRatesForTimeFrame',
        })),
    ];

    const firstItemWithNumberBalance = fiatRatesInTime.find(
        item => !new BigNumber(item?.balance ?? '').isNaN(),
    );

    fiatRatesInTime.unshift({
        ...preparedStartOfTimeFrameItem,
        descriptor: account.descriptor,
        balance:
            preparedStartOfTimeFrameItem?.balance ?? firstItemWithNumberBalance?.balance ?? '0',
    });

    const fiatRatesSortedByTimeAsc = sortTimeFrameItemsByTimeAsc(fiatRatesInTime);
    return fiatRatesSortedByTimeAsc;
};

export const ensureHistoryRates = async (
    symbol: string,
    data: BlockchainAccountBalanceHistory[],
): Promise<BlockchainAccountBalanceHistory[]> => {
    if (!getTickerConfig({ symbol })) return data;

    const missingRates = data
        .filter(({ rates }) => !Object.keys(rates || {}).length)
        .map(({ time }) => time);

    const rateDictionary = await getFiatRatesForTimestamps({ symbol }, missingRates)
        .then(res => (res?.tickers || []).map(({ ts, rates }) => [ts, rates]))
        .then(res => Object.fromEntries(res));

    return data.map(({ rates, time, ...rest }) => ({
        ...rest,
        time,
        rates: rateDictionary[time] || rates,
    }));
};

export const enhanceBlockchainAccountHistory = (
    data: BlockchainAccountBalanceHistory[],
    symbol: NetworkSymbol,
    balanceBefore = '0',
) => {
    let balance = balanceBefore;
    const enhancedResponse = data.map(dataPoint => {
        // subtract sentToSelf field as we don't want to include amounts received/sent to the same account
        const normalizedReceived = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.received).minus(dataPoint.sentToSelf || 0).toFixed()
            : dataPoint.received;
        const normalizedSent = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.sent).minus(dataPoint.sentToSelf || 0).toFixed()
            : dataPoint.sent;

        const formattedReceived = formatNetworkAmount(normalizedReceived, symbol);
        const formattedSent = formatNetworkAmount(normalizedSent, symbol);
        balance = new BigNumber(balance).plus(formattedReceived).minus(formattedSent).toFixed();

        return {
            ...dataPoint,
            received: formattedReceived,
            sent: formattedSent,
            time: resetTime(dataPoint.time),
            balance,
        };
    });
    return enhancedResponse;
};

export const getSuccessAccountBalanceMovements = (
    accountBalanceMovements: LineGraphTimeFrameItemAccountBalance[],
) => (accountBalanceMovements ? accountBalanceMovements.filter(movement => !!movement?.time) : []);

export const enhanceAccountBalanceHistory = async (
    account: Account,
    response: AccountBalanceHistory[],
) => {
    const { symbol, descriptor } = account;
    const responseWithRates = await ensureHistoryRates(symbol, response);
    const enhancedResponse = enhanceBlockchainAccountHistory(responseWithRates, symbol);
    const sortedAccountBalanceHistory = sortTimeFrameItemsByTimeAsc(enhancedResponse);
    const successAccountBalanceMovements = getSuccessAccountBalanceMovements(
        sortedAccountBalanceHistory,
    );
    return successAccountBalanceMovements.map(movement => ({
        ...movement,
        descriptor,
    }));
};

export const fetchAccountBalanceHistory = async (
    account: Account,
    { from, to, groupByInSeconds }: { from?: number; to?: number; groupByInSeconds: number },
) => {
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        from,
        to,
        groupBy: groupByInSeconds,
    });

    if (!response?.success) {
        return [];
    }

    return enhanceAccountBalanceHistory(account, response.payload);
};

export const processBalanceHistoryWithBalanceBefore = async (
    startOfTimeFrameItemWithBalance: LineGraphTimeFrameItemAccountBalance | null,
    account: Account,
    response: AccountBalanceHistory[],
) => {
    const responseWithRates = await ensureHistoryRates(account.symbol, response);
    const enhancedResponse = enhanceBlockchainAccountHistory(
        responseWithRates,
        account.symbol,
        startOfTimeFrameItemWithBalance?.balance ?? '0', // if there are not balance movements before
    );
    const sortedAccountBalanceHistory = sortTimeFrameItemsByTimeAsc(enhancedResponse);
    const successAccountBalanceMovements = getSuccessAccountBalanceMovements(
        sortedAccountBalanceHistory,
    );
    return successAccountBalanceMovements.map(movement => ({
        ...movement,
        descriptor: account.descriptor,
    }));
};

export const fetchAccountBalanceHistoryWithBalanceBefore = async (
    account: Account,
    startOfTimeFrameItemWithBalance: LineGraphTimeFrameItemAccountBalance | null,
    startOfTimeFrameDate: Date,
    endOfTimeFrameDate: Date,
) => {
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        from: getBlockbookSafeTime(getUnixTime(startOfTimeFrameDate)),
        to: getBlockbookSafeTime(getUnixTime(endOfTimeFrameDate)),
        groupBy: 60,
    });
    if (!response?.success) {
        return [];
    }

    const balanceHistory = await processBalanceHistoryWithBalanceBefore(
        startOfTimeFrameItemWithBalance,
        account,
        response.payload,
    );
    return balanceHistory;
};

export const getTimestampsForFiatRatesInTimeFrame = (
    startOfRangeDate: Date,
    endOfRangeDate: Date,
    stepInMinutes: number,
) => {
    const datesInRange = eachMinuteOfInterval(
        {
            start: startOfRangeDate.getTime(),
            end: endOfRangeDate.getTime(),
        },
        {
            step: stepInMinutes,
        },
    );
    const datesInRangeUnixTime = datesInRange.map(date => getBlockbookSafeTime(getUnixTime(date)));
    const datesInRangeUnixTimeSet = new Set(datesInRangeUnixTime);

    return Array.from(datesInRangeUnixTimeSet);
};

export const getBalancesBeforeStartOfRange = (
    accountBalanceHistoryToStartOfRange: LineGraphTimeFrameItemAccountBalance[],
    startOfRangeDate: Date,
) =>
    accountBalanceHistoryToStartOfRange.filter(balance => {
        const balanceDate = new Date(balance.time * 1000);
        return isBefore(balanceDate, startOfRangeDate) || isEqual(balanceDate, startOfRangeDate);
    });

/**
 * We need to know what is the account balance at the beginning of selected graph time frame
 * (to have continuous line based on our current balance even there are no movement in current time frame).
 */
export const getStartItemOfTimeFrame = async (
    account: Account,
    startOfTimeFrame: Date,
): Promise<LineGraphTimeFrameItemAccountBalance | null> => {
    const accountBalanceHistoryToStartOfRange = await fetchAccountBalanceHistory(account, {
        to: getBlockbookSafeTime(getUnixTime(startOfTimeFrame)),
        groupByInSeconds: 60,
    });

    if (accountBalanceHistoryToStartOfRange.length) {
        return accountBalanceHistoryToStartOfRange[accountBalanceHistoryToStartOfRange.length - 1];
    }

    // no account movement before start of requested time frame
    return null;
};

/**
 * After how long periods of time we store the fiat rates.
 */
export const getLineGraphStepInMinutes = (
    endOfRangeDate: Date,
    valueBackInMinutes: number,
): number => {
    const startOfRangeDate = subMinutes(endOfRangeDate, valueBackInMinutes);
    const differenceDays = differenceInDays(endOfRangeDate, startOfRangeDate);

    if (differenceDays === 0) {
        return lineGraphStepInMinutes.hour;
    }
    if (differenceDays === 1) {
        return lineGraphStepInMinutes.day;
    }
    if (differenceDays > 1 && differenceDays < 30) {
        return lineGraphStepInMinutes.week;
    }
    if (differenceDays >= 30 && differenceDays < 120) {
        return lineGraphStepInMinutes.month;
    }

    if (differenceDays <= 365) {
        return lineGraphStepInMinutes.year;
    }

    const differenceYears = differenceInYears(endOfRangeDate, startOfRangeDate);
    // to prevent max URL length error, HTTP status 414, from Blockbook (timestamps are sent to Blockbook with HTTP GET)
    return lineGraphStepInMinutes.year * differenceYears;
};

export const getTimeFrameConfiguration = (
    timeFrame: LineGraphTimeFrameValues,
    endOfRangeDate: Date,
    minutesBackToStartOfRange: number,
) => {
    const stepInMinutes = getLineGraphStepInMinutes(endOfRangeDate, minutesBackToStartOfRange);

    return {
        ...timeSwitchItems[timeFrame],
        stepInMinutes,
    };
};

export const sumLineGraphPoints = (points: LineGraphPoint[]) =>
    points.reduce((previous, currentPoint) => previous + currentPoint.value, 0);

/**
 * Graph points and its dates follow each other from the unix epoch
 * (start on 00:00:00 UTC on 1 January 1970) so it is basically index from 0.
 *
 */
export const minAndMaxGraphPointArrayItemIndex = (points: LineGraphPoint[]) => {
    let maxValue = points[0].value;
    let maxIndex = 0;
    let minIndex = 0;
    let minValue = points[0].value;

    points.forEach((point, index) => {
        if (point.value > maxValue) {
            maxValue = point.value;
            maxIndex = index;
        }
        if (point.value < minValue) {
            minValue = point.value;
            minIndex = index;
        }
    });
    return {
        maxIndex,
        minIndex,
    };
};

// to prevent 0 % when the first item position is passed here
export const getAxisLabelPercentagePosition = (position: number, maxPosition: number) =>
    100 * ((position + 1) / (maxPosition + 1));

export const getExtremaFromGraphPoints = (points: LineGraphPoint[]) => {
    const numberOfPoints = points.length;
    if (numberOfPoints > 0) {
        const { maxIndex, minIndex } = minAndMaxGraphPointArrayItemIndex(points);

        const { value: pointMaxima } = points[maxIndex];
        const { value: pointMinima } = points[minIndex];

        return {
            max: {
                x: getAxisLabelPercentagePosition(maxIndex, numberOfPoints),
                value: pointMaxima,
            },
            min: {
                x: getAxisLabelPercentagePosition(minIndex, numberOfPoints),
                value: pointMinima,
            },
        };
    }
};

/**
 * Merge balances for the same timestamps (when we want to show different accounts together)
 */
export const getTimeFrameIntervalsWithSummaryBalances = (
    differentAccountsTimeFrameItems: Array<LineGraphTimeFrameItemAccountBalance[]>,
) => {
    const differentAccountsTimeFrameItemsMapArray: Array<
        Map<number, LineGraphTimeFrameIntervalPoint>
    > = [];
    const commonTimestampsFiatRatesMap = new Map<number, number>();

    differentAccountsTimeFrameItems.forEach(accountTimeFrameItems => {
        accountTimeFrameItems.forEach(item => {
            if (!commonTimestampsFiatRatesMap.has(item.time)) {
                commonTimestampsFiatRatesMap.set(item.time, item.fiatCurrencyRate!);
            }
        });
        const accountTimeFrameItemsMap = new Map(
            accountTimeFrameItems.map(item => [item.time, item]),
        );
        differentAccountsTimeFrameItemsMapArray.push(accountTimeFrameItemsMap);
    });

    commonTimestampsFiatRatesMap.forEach((fiatCurrencyRate, time) => {
        differentAccountsTimeFrameItemsMapArray.forEach(accountArrayMap => {
            if (!accountArrayMap.has(time)) {
                accountArrayMap.set(time, {
                    time,
                    fiatCurrencyRate,
                    source: 'GeneratedTimeFrame',
                    balance: undefined,
                });
            }
        });
    });

    const differentAccountsTimeFrameItemsWithGenerated =
        differentAccountsTimeFrameItemsMapArray.map(arrayMap => Array.from(arrayMap.values()));

    const sortedDifferentAccountsTimeFrameItemsWithGenerated: Array<
        LineGraphTimeFrameIntervalPoint[]
    > = [];

    differentAccountsTimeFrameItemsWithGenerated.forEach(array => {
        sortedDifferentAccountsTimeFrameItemsWithGenerated.push(
            array.sort((a, b) => a.time - b.time),
        );
    });

    // check first undefined - it means that an account had not exist before
    sortedDifferentAccountsTimeFrameItemsWithGenerated.forEach(array => {
        for (let i = 0; i < array.length; i++) {
            if (array[i].balance === undefined) {
                array[i].balance = '0';
            } else {
                // first known found
                return;
            }
        }
    });

    // fill all unknown balances
    const finalAccountArraysWithAllBalances: Array<LineGraphTimeFrameIntervalPoint[]> = [];

    sortedDifferentAccountsTimeFrameItemsWithGenerated.forEach(accountArray => {
        const arrayWithBalances: LineGraphTimeFrameIntervalPoint[] = [];
        accountArray.forEach((item, index) => {
            const { balance } = item;
            if (!balance && index > 0) {
                const previousTimeFrameItemBalance = arrayWithBalances[index - 1].balance;
                arrayWithBalances.push({
                    ...item,
                    balance: previousTimeFrameItemBalance,
                });
            } else {
                arrayWithBalances.push(item);
            }
        });
        finalAccountArraysWithAllBalances.push(arrayWithBalances);
    });

    const graphPoints: LineGraphPoint[] = [];

    for (let i = 0; i < finalAccountArraysWithAllBalances[0].length; i++) {
        let sumAmount = 0;
        finalAccountArraysWithAllBalances.forEach(arrayWithBalances => {
            const amount = new BigNumber(arrayWithBalances[i].balance!).multipliedBy(
                arrayWithBalances[i].fiatCurrencyRate!,
            );
            sumAmount = new BigNumber(sumAmount).plus(amount).toNumber();
        });
        graphPoints.push({
            date: new Date(finalAccountArraysWithAllBalances[0][i].time * 1000),
            value: sumAmount,
        });
    }

    return graphPoints;
};

export const getLineGraphPoints = (timeFrameItems: LineGraphTimeFrameItemAccountBalance[]) =>
    timeFrameItems.map(item => {
        const value = new BigNumber(item.balance!).multipliedBy(item.fiatCurrencyRate!).toNumber();
        return {
            date: new Date(item.time * 1000),
            value,
        };
    });

/**
 * react-native-graph library has problems with rendering path when there are some invalid values.
 * Also animated=true graph does not show when dates do not follow each other from the unix epoch
 * (start on 00:00:00 UTC on 1 January 1970).
 *
 */
export const getValidGraphPoints = (graphPoints: LineGraphPoint[]) =>
    graphPoints
        .filter(point => !new BigNumber(point.value ?? '').isNaN())
        .map((point, index) => ({
            ...point,
            date: new Date(index),
        }));

export const getFirstAccountBalanceMovement = async (account: Account) => {
    const accountBalanceHistory = await fetchAccountBalanceHistory(account, {
        groupByInSeconds: 3600,
    });
    return accountBalanceHistory?.[0];
};

export const getDifferentNetworkSymbolAccounts = (accounts: Account[]) => {
    const differentNetworkSymbolAccounts: Partial<Record<NetworkSymbol, Account[]>> = {};

    accounts.forEach(account => {
        const { symbol } = account;
        if (differentNetworkSymbolAccounts?.[symbol]) {
            differentNetworkSymbolAccounts[symbol]?.push(account);
        } else {
            differentNetworkSymbolAccounts[symbol] = [account];
        }
    });

    return differentNetworkSymbolAccounts;
};

export const getTimeFrameData = (
    timeFrame: LineGraphTimeFrameValues,
    minutesBackToOldestAccountBalanceMovements: number,
    endOfTimeFrameDate: Date,
) => {
    const backInMinutesBySelectedTimeFrame =
        timeSwitchItems[timeFrame]?.valueBackInMinutes ??
        minutesBackToOldestAccountBalanceMovements;

    // E.g when time frame 1 month is selected but the account has first move 2 weeks ago - we dont want to go 1 month back
    const minutesBackToStartOfRange =
        minutesBackToOldestAccountBalanceMovements < backInMinutesBySelectedTimeFrame
            ? minutesBackToOldestAccountBalanceMovements
            : backInMinutesBySelectedTimeFrame;

    const timeFrameConfiguration = getTimeFrameConfiguration(
        timeFrame,
        endOfTimeFrameDate,
        minutesBackToStartOfRange,
    );
    const startOfTimeFrameDate = subMinutes(endOfTimeFrameDate, minutesBackToStartOfRange);

    const timestampDatesInTimeFrame = getTimestampsForFiatRatesInTimeFrame(
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        timeFrameConfiguration.stepInMinutes,
    );

    return {
        startOfTimeFrameDate,
        timestampDatesInTimeFrame,
    };
};
