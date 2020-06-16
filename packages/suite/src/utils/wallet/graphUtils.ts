import BigNumber from 'bignumber.js';
import { startOfMonth, getUnixTime, fromUnixTime } from 'date-fns';
import { GraphData } from '@wallet-reducers/graphReducer';
import { toFiatCurrency } from './fiatConverterUtils';
import { CoinFiatRates, Account } from '@wallet-types';
import { AggregatedDashboardHistory, AggregatedAccountHistory } from '@wallet-types/fiatRates';

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
        const accountHistory = graphData[i].data;

        if (accountHistory && accountHistory.length > 0) {
            accountHistory.forEach(h => {
                // calc sent/received amounts in fiat
                const dataPoint = {
                    ...h,
                    receivedFiat: calcFiatValueMap(h.received, h.rates || {}),
                    sentFiat: calcFiatValueMap(h.sent, h.rates || {}),
                };

                const d = fromUnixTime(dataPoint.time);
                const key =
                    groupBy === 'day'
                        ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
                        : `${d.getFullYear()}-${d.getMonth() + 1}`;
                const bin = groupedByTimestamp[key];

                // calc sum of sentFiat, receivedFiat, txs fields for each timestamp
                if (!bin) {
                    // no entry for a timestamp yet, set first item
                    const baseProps: AggregatedDashboardHistory = {
                        time:
                            groupBy === 'day'
                                ? dataPoint.time
                                : getUnixTime(startOfMonth(fromUnixTime(dataPoint.time))), // set timestamp to first day of the month
                        txs: dataPoint.txs,
                        balance: dataPoint.balance,
                        sentFiat: dataPoint.sentFiat,
                        receivedFiat: dataPoint.receivedFiat,
                    };

                    const accountProps: AggregatedAccountHistory = {
                        ...baseProps,
                        sent: dataPoint.sent,
                        received: dataPoint.received,
                    };

                    groupedByTimestamp[key] = (type === 'account'
                        ? accountProps
                        : baseProps) as ObjectType<TType>;
                } else {
                    // add txs, sentFiat, receivedFiat values to existing entry
                    bin.txs += dataPoint.txs;
                    sumFiatValueMapInPlace(bin.sentFiat, dataPoint.sentFiat);
                    sumFiatValueMapInPlace(bin.receivedFiat, dataPoint.receivedFiat);
                    if (isAccountAggregatedHistory(bin, type)) {
                        // adding sent/received values
                        bin.sent = new BigNumber(bin.sent).plus(dataPoint.sent).toFixed();
                        bin.received = new BigNumber(bin.received)
                            .plus(dataPoint.received)
                            .toFixed();
                    }
                }
            });
        }
    }

    // convert data from an object indexed by timestamp to an array
    const aggregatedData = Object.keys(groupedByTimestamp).map(timestamp => {
        return groupedByTimestamp[timestamp];
    });

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
