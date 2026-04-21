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
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

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
 * Does given network has backend type with support for retrieving transactions history, e.g. for showing graph?
 */
export function isNetworkWithGraphFeature(symbol: NetworkSymbol, backendType?: BackendType) {
    const hasGraphFeature = getNetworkFeatures(symbol).includes('graph');
    if (!hasGraphFeature) {
        return false;
    }

    return backendType !== 'evm-rpc';
}

const legacyChartSupportedNetworks: ReadonlySet<NetworkSymbol> = new Set([
    'arb',
    'avax',
    'base',
    'bch',
    'bsc',
    'btc',
    'doge',
    'etc',
    'eth',
    'ltc',
    'op',
    'pol',
    'regtest',
    'test',
    'thod',
    'trx',
    'tsep',
    'ttrx',
    'zec',
]);

export const isNetworkWithLegacyGraphFeature = (symbol: NetworkSymbol, backendType?: BackendType) =>
    legacyChartSupportedNetworks.has(symbol) && isNetworkWithGraphFeature(symbol, backendType);

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

export const enhanceBlockchainAccountHistoryFromCurrentBalance = (
    data: BlockchainAccountBalanceHistory[],
    symbol: NetworkSymbol,
    currentBalance = '0',
    anchorTime?: number,
) => {
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    const enhancedResponse = Array<BlockchainAccountBalanceHistory & { balance: string }>(
        sortedData.length,
    );

    // Absolute mode: every bucket already carries its end-of-bucket balance
    // (e.g. Solana's per-tx `postBalance`). Skip the right-edge anchor +
    // walk-back reconstruction — those are only needed when the source emits
    // aggregated deltas (Blockbook's BTC/ETH `getBalanceHistory`). Bucket
    // received/sent are derived from successive balance deltas so the bar
    // overlay (`LiveFiatGraph`) still has values to label; the leftmost
    // bucket has no predecessor, so its received/sent fall back to whatever
    // the source emitted (typically '0').
    const isAbsoluteMode =
        sortedData.length > 0 && sortedData.every(point => point.balance !== undefined);

    if (isAbsoluteMode) {
        let leftBalance: BigNumber | null = null;

        for (let i = 0; i < sortedData.length; i++) {
            const dataPoint = sortedData[i];
            // sortedData[i].balance is defined (checked by isAbsoluteMode).
            const rightBalance = new BigNumber(dataPoint.balance!);
            const formattedBalance = formatNetworkAmount(rightBalance.toFixed(), symbol);

            let formattedReceived: string;
            let formattedSent: string;
            if (leftBalance === null) {
                // First bucket — no predecessor to diff against. Pass through
                // whatever the source supplied (typically '0'/'0').
                formattedReceived = formatNetworkAmount(dataPoint.received, symbol);
                formattedSent = formatNetworkAmount(dataPoint.sent, symbol);
            } else {
                const delta = rightBalance.minus(leftBalance);
                formattedReceived = formatNetworkAmount(
                    delta.isGreaterThan(0) ? delta.toFixed() : '0',
                    symbol,
                );
                formattedSent = formatNetworkAmount(
                    delta.isLessThan(0) ? delta.abs().toFixed() : '0',
                    symbol,
                );
            }

            enhancedResponse[i] = {
                ...dataPoint,
                received: formattedReceived,
                sent: formattedSent,
                time: resetTime(dataPoint.time),
                balance: formattedBalance,
            };

            leftBalance = rightBalance;
        }

        if (anchorTime !== undefined) {
            const shouldPrependAnchor =
                enhancedResponse.length === 0 || enhancedResponse[0].time > anchorTime;

            if (shouldPrependAnchor) {
                // Anchor inherits the first bucket's balance — no aggregate
                // history exists before it in absolute mode.
                const firstBalance =
                    enhancedResponse.length > 0 ? enhancedResponse[0].balance : '0';
                enhancedResponse.unshift({
                    balance: firstBalance,
                    rates: {},
                    received: '0',
                    sent: '0',
                    sentToSelf: '0',
                    time: anchorTime,
                    txs: 0,
                });
            }
        }

        return enhancedResponse;
    }

    let balance = new BigNumber(currentBalance);

    for (let i = sortedData.length - 1; i >= 0; i--) {
        const dataPoint = sortedData[i];
        const normalizedReceived = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.received).minus(dataPoint.sentToSelf || 0).toFixed()
            : dataPoint.received;
        const normalizedSent = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.sent).minus(dataPoint.sentToSelf || 0).toFixed()
            : dataPoint.sent;

        const formattedReceived = formatNetworkAmount(normalizedReceived, symbol);
        const formattedSent = formatNetworkAmount(normalizedSent, symbol);

        enhancedResponse[i] = {
            ...dataPoint,
            received: formattedReceived,
            sent: formattedSent,
            time: resetTime(dataPoint.time),
            balance: balance.toFixed(),
        };

        balance = balance.minus(formattedReceived).plus(formattedSent);
    }

    if (anchorTime !== undefined) {
        const shouldPrependAnchor =
            enhancedResponse.length === 0 || enhancedResponse[0].time > anchorTime;

        if (shouldPrependAnchor) {
            enhancedResponse.unshift({
                balance: balance.toFixed(),
                rates: {},
                received: '0',
                sent: '0',
                sentToSelf: '0',
                time: anchorTime,
                txs: 0,
            });
        }
    }

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
        .filter(m => !!m)
        .map(m => m!.toNumber());
    const minValue = BigNumber.min(...minsToCompare);

    return [minValue as TValue, maxValue as TValue];
};

export const sumFiatValueMap = (valueMap: FiatValueMap, obj: FiatValueMap) => {
    const newMap = { ...valueMap };
    sumFiatValueMapInPlace(newMap, obj);

    return newMap;
};

const calcMinYDomain = (minMaxValues: [number, number]) => {
    const [minDataValue] = minMaxValues;
    const decimals = minDataValue.toString().split('.')[1]?.length;
    const min = decimals && decimals > 0 ? 1 / 10 ** decimals : 0.00000001;

    return min;
};

export const calcYDomain = (
    type: 'fiat' | 'crypto',
    scale: 'linear' | 'log',
    minMaxValues: [number, number],
    lastBalance?: string,
): [number, number] => {
    const [, maxDataValue] = minMaxValues;
    const maxValueMultiplier = scale === 'linear' ? 1.2 : 10;

    let minValue: number;
    if (scale === 'linear') {
        minValue = 0;
    } else if (type === 'fiat') {
        minValue = 0.01;
    } else {
        minValue = calcMinYDomain(minMaxValues);
    }

    if (maxDataValue > 0) {
        return [minValue, maxDataValue * maxValueMultiplier];
    }

    const lastBalanceBn = lastBalance ? new BigNumber(lastBalance) : null;
    if (lastBalanceBn && lastBalanceBn.gt(0)) {
        return [minValue, lastBalanceBn.toNumber() * 1.2];
    }

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
    const end = lastData && lastTick < lastData.time ? lastData.time : lastTick;

    const xPadding = (() => {
        switch (range.label) {
            case 'all':
                return 3600 * 24 * 30;
            case 'year':
                return 3600 * 24 * 14;
            case 'month':
            case 'day':
                return 3600 * 24;
            case 'week':
                return 3600 * 12;
            case 'hour':
                return 3600;
            case 'range':
                return range.groupBy === 'day' ? 3600 * 24 : 3600 * 24 * 14;
            default:
                return exhaustive(range);
        }
    })();

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
