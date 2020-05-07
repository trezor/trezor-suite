import BigNumber from 'bignumber.js';
import { CoinFiatRates, Account } from '@wallet-types';
import { AggregatedAccountBalanceHistory } from '@wallet-types/fiatRates';
import { GraphData } from '@wallet-reducers/graphReducer';
import { toFiatCurrency } from './fiatConverterUtils';

type FiatRates = NonNullable<CoinFiatRates['current']>['rates'];

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
export const sumFiatValueMap = (
    valueMap: { [k: string]: string | undefined },
    obj: { [k: string]: string | undefined },
) => {
    Object.entries(obj).forEach(keyVal => {
        const [key, val] = keyVal;
        const previousValue = valueMap[key] ?? '0';
        valueMap[key] = new BigNumber(previousValue).plus(val ?? 0).toFixed();
    });
};

export const aggregateBalanceHistory = (
    graphData: GraphData[],
): AggregatedAccountBalanceHistory[] => {
    const groupedByTimestamp: {
        [key: string]: {
            time: number;
            txs: number;
            sentFiat: { [k: string]: string | undefined };
            receivedFiat: { [k: string]: string | undefined };
            rates: {};
        };
    } = {};

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

                // calc sum of sentFiat, receivedFiat, txs fields for each timestamp
                if (!groupedByTimestamp[dataPoint.time]) {
                    // no entry for a timestamp yet, set first item
                    groupedByTimestamp[dataPoint.time] = {
                        time: Number(dataPoint.time),
                        txs: dataPoint.txs,
                        sentFiat: dataPoint.sentFiat,
                        receivedFiat: dataPoint.receivedFiat,
                        rates: {},
                    };
                } else {
                    // add txs, sentFiat, receivedFiat values to existing entry
                    groupedByTimestamp[dataPoint.time].txs += dataPoint.txs;
                    sumFiatValueMap(
                        groupedByTimestamp[dataPoint.time].sentFiat,
                        dataPoint.sentFiat,
                    );
                    sumFiatValueMap(
                        groupedByTimestamp[dataPoint.time].receivedFiat,
                        dataPoint.receivedFiat,
                    );
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
