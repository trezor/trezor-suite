import TrezorConnect from 'trezor-connect';
import { getUnixTime, subWeeks, isWithinInterval, fromUnixTime } from 'date-fns';
import { Dispatch, GetState } from '@suite-types';
import {
    ACCOUNT_GRAPH_SUCCESS,
    ACCOUNT_GRAPH_FAIL,
    AGGREGATED_GRAPH_START,
    AGGREGATED_GRAPH_SUCCESS,
    ACCOUNT_GRAPH_START,
    SET_SELECTED_RANGE,
    SET_SELECTED_VIEW,
} from './constants/graphConstants';
import { Account } from '@wallet-types';
import { GraphRange, GraphView, GraphData } from '@wallet-types/graph';
import {
    accountGraphDataFilterFn,
    deviceGraphDataFilterFn,
    enhanceBlockchainAccountHistory,
} from '@wallet-utils/graphUtils';

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
      }
    | {
          type: typeof SET_SELECTED_VIEW;
          payload: GraphView;
      };

export const setSelectedRange = (range: GraphRange) => ({
    type: SET_SELECTED_RANGE,
    payload: range,
});

export const setSelectedView = (view: GraphView) => ({
    type: SET_SELECTED_VIEW,
    payload: view,
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
    dispatch({
        type: ACCOUNT_GRAPH_START,
        payload: {
            account: {
                deviceState: account.deviceState,
                descriptor: account.descriptor,
                symbol: account.symbol,
            },
            data: [],
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
        const enhancedResponse = enhanceBlockchainAccountHistory(response.payload, account.symbol);

        dispatch({
            type: ACCOUNT_GRAPH_SUCCESS,
            payload: {
                account: {
                    deviceState: account.deviceState,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                },
                data: enhancedResponse,
                isLoading: false,
                error: false,
            },
        });
    } else {
        dispatch({
            type: ACCOUNT_GRAPH_FAIL,
            payload: {
                account: {
                    deviceState: account.deviceState,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                },
                data: [],
                isLoading: false,
                error: true,
            },
        });
    }
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
