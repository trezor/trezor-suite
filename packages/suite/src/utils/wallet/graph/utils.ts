import { fromUnixTime, isWithinInterval } from 'date-fns';

import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { resetTime } from '@suite-common/suite-utils';
import {
    type BackendType,
    type NetworkSymbol,
    getNetwork,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { BlockchainAccountBalanceHistory, StaticSessionId } from '@trezor/connect';
import { BigNumber, isNotUndefined } from '@trezor/utils';

import { type AppState } from 'src/reducers/store';
import { type State as GraphState } from 'src/reducers/wallet/graphReducer';
import {
    type CommonAggregatedHistory,
    type GraphData,
    type GraphRange,
} from 'src/types/wallet/graph';

import { type FiatValueMap, type GraphDataPoint, type TypeName } from './types';
import { sumFiatValueMapInPlace } from './utilsShared';

export const deviceGraphDataFilterFn = (d: GraphData, deviceState: StaticSessionId | undefined) => {
    if (!deviceState) return false;

    return d.account.deviceState === deviceState;
};

export const ensureHistoryRates = async (
    symbol: NetworkSymbol,
    data: BlockchainAccountBalanceHistory[],
    baseCurrencyCode: BaseCurrencyCode,
    isElectrumBackend: boolean,
): Promise<BlockchainAccountBalanceHistory[]> => {
    if (!getNetwork(symbol).coingeckoId) return data;

    const missingRates = data
        .filter(({ rates }) => !Object.keys(rates || {}).length)
        .map(({ time }) => time);

    const rateDictionary = await getFiatRatesForTimestamps(
        { symbol },
        missingRates,
        baseCurrencyCode,
        isElectrumBackend,
    )
        .then(res => (res?.tickers || []).map(({ ts, rates }) => [ts, rates]))
        .then(res => Object.fromEntries(res));

    return data.map(({ rates, time, ...rest }) => ({
        ...rest,
        time,
        rates: rateDictionary[time] || rates,
    }));
};

export const accountGraphDataFilterFn = (d: GraphData, account: Account) =>
    d.account.descriptor === account.descriptor &&
    d.account.symbol === account.symbol &&
    d.account.deviceState === account.deviceState;

/**
 * Extract only accounts for which we don't have any data for given interval
 */
export function getPristineAccounts(graph: AppState['wallet']['graph'], accounts: Account[]) {
    return accounts.filter(account => !graph.data.find(d => accountGraphDataFilterFn(d, account)));
}

/**
 * Does given network has backend type with support for retrieving transactions history, e.g. for showing graph?
 */
export function isNetworkWithGraphFeature(symbol: NetworkSymbol, backendType?: BackendType) {
    const hasGraphFeature = getNetworkFeatures(symbol).includes('graph');
    if (!hasGraphFeature) {
        return false;
    }

    return backendType !== 'evm-rpc';
}

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

/**
 * Return array with 2 items, minimum non-zero value and maximum value calculated from sent, received and balance fields
 */
export const getMinMaxValueFromData = <TType extends TypeName, TValue extends BigNumber>(
    data: GraphDataPoint<TType>[],
    _type: TType,
    extractSentValue: (sourceData: GraphDataPoint<TType>) => TValue | undefined,
    extractReceivedValue: (sourceData: GraphDataPoint<TType>) => TValue | undefined,
    extractBalanceValue: (sourceData: GraphDataPoint<TType>) => TValue | undefined,
): [TValue, TValue] => {
    if (!data || data.length === 0) {
        return [new BigNumber(0) as TValue, new BigNumber(0) as TValue];
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

    const maxValue = BigNumber.max(maxSent, maxReceived, maxBalance);

    const minsToCompare = [minSent, minReceived, minBalance]
        .filter(isNotUndefined)
        .map(m => m.toNumber());
    const minValue = BigNumber.min(...minsToCompare);

    return [minValue as TValue, maxValue as TValue];
};

export const sumFiatValueMap = (valueMap: FiatValueMap, obj: FiatValueMap) => {
    const newMap = { ...valueMap };
    sumFiatValueMapInPlace(newMap, obj);

    return newMap;
};

export const calcYDomain = (
    minMaxValues: [number, number],
    lastBalance?: string,
): [number, number] => {
    const [, maxDataValue] = minMaxValues;
    const maxValueMultiplier = 1.2;
    const minValue = 0;

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
        case 'week':
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

type GetGraphDataForIntervalProps = {
    account?: Account;
    deviceState?: StaticSessionId;
    graph: GraphState;
};

export const getGraphDataForInterval = ({
    account,
    deviceState,
    graph,
}: GetGraphDataForIntervalProps) => {
    const { selectedRange } = graph;

    const data: GraphData[] = [];
    graph.data.forEach(accountGraph => {
        const accountFilter = account ? accountGraphDataFilterFn(accountGraph, account) : true;
        const deviceFilter = deviceState
            ? deviceGraphDataFilterFn(accountGraph, deviceState)
            : true;

        if (accountFilter && deviceFilter) {
            if (selectedRange.startDate && selectedRange.endDate) {
                data.push({
                    ...accountGraph,
                    data:
                        accountGraph.data?.filter(d =>
                            isWithinInterval(fromUnixTime(d.time), {
                                start: selectedRange.startDate,
                                end: selectedRange.endDate,
                            }),
                        ) ?? [],
                });
            } else {
                data.push(accountGraph);
            }
        }
    });

    return data;
};
