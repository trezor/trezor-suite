import BigNumber from 'bignumber.js';
import { startOfMonth, getUnixTime, fromUnixTime } from 'date-fns';
import { toFiatCurrency } from './fiatConverterUtils';
import { CoinFiatRates, Account } from '@wallet-types';
import {
    AggregatedDashboardHistory,
    AggregatedAccountHistory,
    GraphRange,
    GraphData,
    CommonAggregatedHistory,
} from '@wallet-types/graph';
import { formatNetworkAmount } from './accountUtils';
import { resetTime } from '@suite-utils/date';
import { BlockchainAccountBalanceHistory } from 'trezor-connect';

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
): history is AggregatedAccountHistory => {
    return (history as AggregatedAccountHistory).sent !== undefined && type === 'account';
};

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
 * @param {({ [k: string]: string | undefined })} valueMap
 * @param {({ [k: string]: string | undefined })} obj
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
 * Return maximum sent/received crypto or fiat amount from the data
 */
export const getMaxValueFromData = <TType extends TypeName>(
    data: ObjectType<TType>[],
    _type: TType,
    extractSentValue: (sourceData: ObjectType<TType>) => string | undefined,
    extractReceivedValue: (sourceData: ObjectType<TType>) => string | undefined,
) => {
    let maxSent =
        data && data.length > 0 ? new BigNumber(extractSentValue(data[0]) || 0) : new BigNumber(0);
    let maxReceived =
        data && data.length > 0
            ? new BigNumber(extractReceivedValue(data[0]) || 0)
            : new BigNumber(0);

    data.forEach(d => {
        const newSentValue = new BigNumber(extractSentValue(d) || 0);
        const newReceivedValue = new BigNumber(extractReceivedValue(d) || 0);
        if (newSentValue.gt(maxSent)) {
            maxSent = newSentValue;
        }
        if (newReceivedValue.gt(maxReceived)) {
            maxReceived = newReceivedValue;
        }
    });
    const maxValue = Math.max(maxSent.toNumber(), maxReceived.toNumber());
    return maxValue;
};

export const aggregateBalanceHistory = <TType extends TypeName>(
    graphData: GraphData[],
    groupBy: 'day' | 'month',
    type: TType,
): ObjectType<TType>[] => {
    const groupedByTimestamp: { [key: string]: ObjectType<TType> } = {};

    for (let i = 0; i < graphData.length; i++) {
        // graph data for one account;
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

                    groupedByTimestamp[key] = (type === 'account'
                        ? accountProps
                        : baseProps) as ObjectType<TType>;
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
        .map(timestamp => {
            return groupedByTimestamp[timestamp];
        })
        .sort((a, b) => Number(a.time) - Number(b.time)); // sort from older to newer;;
    return aggregatedData;
};

export const accountGraphDataFilterFn = (d: GraphData, account: Account) => {
    return (
        d.account.descriptor === account.descriptor &&
        d.account.symbol === account.symbol &&
        d.account.deviceState === account.deviceState
    );
};

export const deviceGraphDataFilterFn = (d: GraphData, deviceState: string | undefined) => {
    if (!deviceState) return false;
    return d.account.deviceState === deviceState;
};

export const calcYDomain = (maxValue?: number) => {
    if (maxValue === undefined) {
        return undefined;
    }
    if (maxValue > 0) {
        return [0, maxValue * 1.2] as [number, number];
    }

    // got maxValue === 0
    // We basically don't handle the value of tokens txs.
    // They'll create dataPoints for the graph, but the sent/received amounts are always 0
    // This make sure we show nice fake y axis in cases in which there are only tokens txs
    return [0, 10] as [number, number];
};

export const calcXDomain = (ticks: number[], data: { time: number }[], range: GraphRange) => {
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
        default:
            xPadding = 3600 * 12; // 12 hours
            break;
    }

    return [start - xPadding, end + xPadding] as [number, number];
};

export const getFormattedLabel = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'all':
            return 'all';
        case 'year':
            return '1Y';
        case 'month':
            return '1M';
        case 'week':
            return '1W';
        // no default
    }
};

export const getFormattedLabelLong = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'all':
            return 'all';
        case 'year':
            return '1 year';
        case 'month':
            return '1 month';
        case 'week':
            return '1 week';
        // no default
    }
};

export const calcFakeGraphDataForTimestamps = (
    timestamps: number[],
    data: CommonAggregatedHistory[],
) => {
    const balanceData: CommonAggregatedHistory[] = [];
    const firstDataPoint = data[0];
    const lastDataPoint = data[data.length - 1];

    // calc fake data points for each label even if there are no real txs for given timestamp (label)
    timestamps.forEach(ts => {
        if (firstDataPoint && lastDataPoint) {
            const existing = data.find(d => d.time === ts);
            if (existing) {
                balanceData.push(existing);
            } else if (ts < firstDataPoint.time) {
                const closestData = firstDataPoint;
                balanceData.push({
                    time: ts,
                    sent: '0',
                    received: '0',
                    sentFiat: {},
                    receivedFiat: {},
                    balanceFiat: {},
                    // calculating fake data for dashboard graph doesn't make sense, as we would have to reflect different fiat rates in given time
                    // balanceFiat: sumFiatValueMap(
                    //     subFiatValueMap(closestData.balanceFiat, closestData.receivedFiat),
                    //     closestData.sentFiat,
                    // ),
                    txs: 0,
                    balance: closestData.balance
                        ? new BigNumber(closestData.balance)
                              .plus(closestData.sent ?? 0)
                              .minus(closestData.received ?? 0)
                              .toFixed()
                        : undefined,
                });
            } else if (ts > lastDataPoint.time) {
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
            } else {
                const toPush = data.filter(d => d.time <= ts && !balanceData.includes(d));
                balanceData.push(...toPush);
            }
        }
    });

    // TODO: sometimes the last datapoint[s] are outside of calculated closed range (eg one year range ends on current day 00:00, instead of 23:59)
    // workaround
    data.forEach(d => {
        if (!balanceData.includes(d)) {
            balanceData.push(d);
        }
    });

    const sortedData = balanceData.sort((a, b) => Number(a.time) - Number(b.time));
    return sortedData;
};

export const enhanceBlockchainAccountHistory = (
    data: BlockchainAccountBalanceHistory[],
    symbol: Account['symbol'],
) => {
    let balance = '0';
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
