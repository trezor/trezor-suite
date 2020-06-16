import TrezorConnect, { BlockchainAccountBalanceHistory } from 'trezor-connect';
import { getUnixTime, subWeeks, isWithinInterval, fromUnixTime } from 'date-fns';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { resetTime } from '@suite-utils/date';
import { Dispatch, GetState } from '@suite-types';
import {
    ACCOUNT_GRAPH_SUCCESS,
    ACCOUNT_GRAPH_FAIL,
    AGGREGATED_GRAPH_START,
    AGGREGATED_GRAPH_SUCCESS,
    ACCOUNT_GRAPH_START,
    SET_SELECTED_RANGE,
} from './constants/graphConstants';
import { Account } from '@wallet-types';
import { GraphRange } from '@wallet-types/fiatRates';
import { accountGraphDataFilterFn, deviceGraphDataFilterFn } from '@suite/utils/wallet/graphUtils';
import { GraphData } from '@wallet-reducers/graphReducer';
import BigNumber from 'bignumber.js';

export type GraphActions =
    | {
          type: typeof ACCOUNT_GRAPH_SUCCESS;
          payload: GraphData;
      }
    | {
          type: typeof ACCOUNT_GRAPH_START;
          payload: GraphData;
      }
    | {
          type: typeof ACCOUNT_GRAPH_FAIL;
          payload: GraphData;
      }
    | {
          type: typeof AGGREGATED_GRAPH_START;
      }
    | {
          type: typeof AGGREGATED_GRAPH_SUCCESS;
      }
    | {
          type: typeof SET_SELECTED_RANGE;
          payload: GraphRange;
      };

export const setSelectedRange = (range: GraphRange) => ({
    type: SET_SELECTED_RANGE,
    payload: range,
});

/**
 * Fetch the account history (received, sent amounts, num of txs) for the given `startDate`, `endDate`.
 * Returned data are grouped by `groupBy` seconds
 * No XRP support
 *
 * @param {Account} account
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number} groupBy
 * @returns
 */
export const fetchAccountGraphData = (
    account: Account,
    startDate: Date | null,
    endDate: Date | null,
    range: GraphRange,
) => async (dispatch: Dispatch, _getState: GetState) => {
    const lastBalance = account.formattedBalance; // todo availableBalance or balance?

    dispatch({
        type: ACCOUNT_GRAPH_START,
        payload: {
            account: {
                deviceState: account.deviceState,
                descriptor: account.descriptor,
                symbol: account.symbol,
            },
            data: null,
            isLoading: true,
            error: false,
        },
    });

    let intervalParams = {};
    if (range.weeks) {
        intervalParams = {
            from: getUnixTime(startDate!),
            to: getUnixTime(endDate!),
        };
    }

    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        groupBy: 3600 * 24, // day
        ...intervalParams,
    });

    if (response?.success) {
        const enhancedResponse = response.payload.map(h => {
            const normalizedReceived = h.sentToSelf
                ? new BigNumber(h.received).minus(h.sentToSelf || 0).toFixed()
                : h.received;
            const normalizedSent = h.sentToSelf
                ? new BigNumber(h.sent).minus(h.sentToSelf || 0).toFixed()
                : h.sent;

            return {
                ...h,
                received: formatNetworkAmount(normalizedReceived, account.symbol),
                sent: formatNetworkAmount(normalizedSent, account.symbol),
                time: resetTime(h.time),
            };
        });

        let balance = lastBalance;

        interface WithBalance extends BlockchainAccountBalanceHistory {
            balance: string;
        }

        const withBalance: WithBalance[] = [];

        for (let i = enhancedResponse.length - 1; i > 0; i--) {
            const curItem = enhancedResponse[i];
            console.log('i', i);
            console.log('balance', balance);
            // console.log('enhancedResponse[i]', enhancedResponse[i]);
            withBalance.push({
                ...curItem,
                balance,
            });
            balance = new BigNumber(balance).minus(curItem.received).plus(curItem.sent).toFixed();
            console.log('prev balance', balance);
        }
        console.log('withBalance', withBalance);

        dispatch({
            type: ACCOUNT_GRAPH_SUCCESS,
            payload: {
                account: {
                    deviceState: account.deviceState,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                },
                data: withBalance,
                isLoading: false,
                error: false,
            },
        });
        return enhancedResponse;
    }
    dispatch({
        type: ACCOUNT_GRAPH_FAIL,
        payload: {
            account: {
                deviceState: account.deviceState,
                descriptor: account.descriptor,
                symbol: account.symbol,
            },
            data: null,
            isLoading: false,
            error: true,
        },
    });
    return null;
};

export const updateGraphData = (
    accounts: Account[],
    options?: {
        newAccountsOnly?: boolean;
    },
) => async (dispatch: Dispatch, getState: GetState) => {
    const { graph } = getState().wallet;
    const { selectedRange } = graph;

    // TODO: default behaviour should be fetch only new data (since last timestamp)
    let filteredAccounts: Account[] = accounts;
    if (options?.newAccountsOnly) {
        // add only accounts for which we don't have any data for given interval
        filteredAccounts = accounts.filter(
            account => !graph.data.find(d => accountGraphDataFilterFn(d, account)),
        );
        if (filteredAccounts.length === 0) {
            return;
        }
    }

    dispatch({
        type: AGGREGATED_GRAPH_START,
    });
    const promises = filteredAccounts.map(
        a =>
            // dispatch(fetchAccountGraphData(a, startDate, endDate, selectedRange)),
            dispatch(fetchAccountGraphData(a, null, null, selectedRange)), // fetch for all range
    );
    await Promise.all(promises);

    dispatch({
        type: AGGREGATED_GRAPH_SUCCESS,
    });
};

export const getGraphDataForInterval = (options: { account?: Account; deviceState?: string }) => (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { graph } = getState().wallet;
    const { selectedRange } = graph;

    const startDate =
        selectedRange.label === 'all' ? null : subWeeks(new Date(), selectedRange.weeks!);
    const endDate = selectedRange.label === 'all' ? null : new Date();

    const data: GraphData[] = [];
    graph.data.forEach(accountGraph => {
        const accountFilter = options.account
            ? accountGraphDataFilterFn(accountGraph, options.account)
            : true;
        const deviceFilter = options.deviceState
            ? deviceGraphDataFilterFn(accountGraph, options.deviceState)
            : true;

        if (accountFilter && deviceFilter) {
            if (startDate && endDate) {
                data.push({
                    ...accountGraph,
                    data:
                        accountGraph.data?.filter(d =>
                            isWithinInterval(fromUnixTime(d.time), {
                                start: startDate,
                                end: endDate,
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
