import BigNumber from 'bignumber.js';
import { CoinFiatRates, Account } from '@wallet-types';
import { AggregatedAccountBalanceHistory } from '@wallet-types/fiatRates';
import { GraphData } from '@wallet-reducers/graphReducer';
import { toFiatCurrency } from './fiatConverterUtils';

type FiatRates = NonNullable<CoinFiatRates['current']>['rates'];

export const calcFiatValueMap = (amount: string, rates: FiatRates): { [k: string]: string } => {
    return Object.keys(rates).reduce((acc, fiatSymbol) => {
        return {
            ...acc,
            [fiatSymbol]: toFiatCurrency(amount, fiatSymbol, rates),
        };
    }, {});
};

export const sumFiatValueMap = (
    valueMap: { [k: string]: string },
    obj: { [k: string]: string },
) => {
    const valueMapCopy = { ...valueMap };
    Object.entries(obj).forEach(keyVal => {
        const [key, val] = keyVal;
        const previousValue = valueMapCopy[key] ?? '0';
        valueMapCopy[key] = new BigNumber(previousValue).plus(val ?? 0).toFixed();
    });
    return valueMapCopy;
};

export const aggregateBalanceHistory = (
    graphData: GraphData[],
): AggregatedAccountBalanceHistory[] => {
    const enhancedHistory = graphData
        .map(d => d.data)
        .map((accountHistory, _i) => {
            if (accountHistory && accountHistory.length > 0) {
                // const { symbol } = accounts[i];
                const enhancedResponse = accountHistory.map(h => ({
                    ...h,
                    // @ts-ignore incorrect types in connect
                    receivedFiat: calcFiatValueMap(h.received, h.rates || {}),
                    // @ts-ignore incorrect types in connect
                    sentFiat: calcFiatValueMap(h.sent, h.rates || {}),
                }));
                return enhancedResponse;
            }
            return null;
        })
        .filter(t => t !== null);

    const flattedHistory: NonNullable<typeof enhancedHistory[number]> = enhancedHistory.flat();

    const groupedByTimestamp: { [key: string]: typeof flattedHistory } = {};
    flattedHistory.forEach(dataPoint => {
        if (!dataPoint) return;
        if (!groupedByTimestamp[dataPoint.time]) {
            groupedByTimestamp[dataPoint.time] = [];
        }
        groupedByTimestamp[dataPoint.time].push(dataPoint);
    });

    const aggregatedData = Object.keys(groupedByTimestamp).map(timestamp => {
        const dataPoints = groupedByTimestamp[timestamp];

        return {
            time: Number(timestamp),
            txs: dataPoints.reduce((acc, h) => acc + h.txs, 0),
            sentFiat: dataPoints.reduce((acc, h) => sumFiatValueMap(acc, h.sentFiat), {}),
            receivedFiat: dataPoints.reduce((acc, h) => sumFiatValueMap(acc, h.receivedFiat), {}),
            rates: {},
        };
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
