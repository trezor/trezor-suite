import { fromUnixTime, getUnixTime, startOfMonth } from 'date-fns';

import { BASE_CURRENCY_ZERO, toFiatCurrency } from '@suite-common/wallet-utils';
import type { FiatRatesBySymbol, StaticSessionId } from '@trezor/connect';
import { BigNumber, typedObjectFromEntries, typedObjectKeys } from '@trezor/utils';

import type { State as GraphState } from 'src/reducers/wallet/graphReducer';
import {
    type AggregatedAccountHistory,
    type AggregatedDashboardHistory,
    type GraphData,
} from 'src/types/wallet/graph';

import { type FiatValueMap, type GraphDataPoint, type TypeName } from './types';
import { getGraphDataForInterval } from './utils';
import { sumFiatValueMapInPlace } from './utilsShared';

const calcFiatValueMap = (amount: string, rates: FiatRatesBySymbol): FiatValueMap =>
    typedObjectFromEntries(
        typedObjectKeys(rates).map(fiatSymbol => [
            fiatSymbol,
            toFiatCurrency({ amount, rate: rates[fiatSymbol] }) ?? BASE_CURRENCY_ZERO,
        ]),
    );

const isAccountAggregatedHistory = (
    history: AggregatedAccountHistory | AggregatedDashboardHistory,
    type: 'account' | 'dashboard',
): history is AggregatedAccountHistory =>
    (history as AggregatedAccountHistory).sent !== undefined && type === 'account';

export const aggregateBalanceHistory = <TType extends TypeName>(
    graphData: GraphData[],
    groupBy: 'day' | 'month',
    type: TType,
): GraphDataPoint<TType>[] => {
    const groupedByTimestamp: { [key: string]: GraphDataPoint<TType> } = {};

    for (let i = 0; i < graphData.length; i++) {
        // graph data for one account
        const accountHistory = graphData[i]?.data;

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
                    ) as GraphDataPoint<TType>;
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
        .flatMap(timestamp => {
            const point = groupedByTimestamp[timestamp];

            return point ? [point] : [];
        })
        .sort((a, b) => Number(a.time) - Number(b.time)); // sort from older to newer;;

    return aggregatedData;
};

type PrepareGraphDataAsyncProps = {
    graph: GraphState;
    deviceState: StaticSessionId | undefined;
};

/**
 * Poor man's substitute for web worker, but it does the job perfectly - does expensive calculations async without
 * lagging the renderer thread.
 */
export const prepareGraphDataAsync = ({
    graph,
    deviceState,
}: PrepareGraphDataAsyncProps): Promise<GraphDataPoint<'dashboard'>[]> =>
    new Promise(resolve => {
        window.setTimeout(() => {
            const history = getGraphDataForInterval({ deviceState, graph });
            const { groupBy } = graph.selectedRange;
            const type = 'dashboard';
            const aggregatedData = aggregateBalanceHistory(history, groupBy, type);
            resolve(aggregatedData);
        }, 0);
    });
