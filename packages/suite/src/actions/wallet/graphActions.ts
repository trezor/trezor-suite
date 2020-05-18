import TrezorConnect from 'trezor-connect';
import { getUnixTime, subWeeks } from 'date-fns';
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
import { accountGraphDataFilterFn } from '@suite/utils/wallet/graphUtils';
import { GraphData } from '@wallet-reducers/graphReducer';

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
          payload: {
              interval: GraphRange['label'];
          };
      }
    | {
          type: typeof AGGREGATED_GRAPH_SUCCESS;
          payload: {
              interval: GraphRange['label'];
          };
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
    const interval = range.label;
    dispatch({
        type: ACCOUNT_GRAPH_START,
        payload: {
            account: {
                deviceState: account.deviceState,
                descriptor: account.descriptor,
                symbol: account.symbol,
            },
            interval,
            data: null,
            isLoading: true,
            error: false,
        },
    });

    let intervalParams = {};
    const secondsInDay = 3600 * 24;
    const secondsInMonth = secondsInDay * 30;
    let groupBy = secondsInMonth;
    if (range.weeks) {
        groupBy = range.weeks >= 52 ? secondsInMonth : secondsInDay; // group by month or day
        intervalParams = {
            from: getUnixTime(startDate!),
            to: getUnixTime(endDate!),
            groupBy,
        };
    } else {
        groupBy = secondsInMonth;
        intervalParams = {
            groupBy,
        };
    }

    const setDayToFirstOfMonth = groupBy >= secondsInMonth;
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        ...intervalParams,
    });

    if (response?.success) {
        const enhancedResponse = response.payload.map(h => ({
            ...h,
            received: formatNetworkAmount(h.received, account.symbol),
            sent: formatNetworkAmount(h.sent, account.symbol),
            time: resetTime(h.time, setDayToFirstOfMonth), // adapts to local timezone
        }));
        dispatch({
            type: ACCOUNT_GRAPH_SUCCESS,
            payload: {
                account: {
                    deviceState: account.deviceState,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                },
                interval,
                data: enhancedResponse,
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
            interval,
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
            account =>
                !graph.data.find(
                    d => accountGraphDataFilterFn(d, account) && d.interval === selectedRange.label,
                ),
        );
        if (filteredAccounts.length === 0) {
            return;
        }
    }

    const startDate =
        selectedRange.label === 'all' ? null : subWeeks(new Date(), selectedRange.weeks!);
    const endDate = selectedRange.label === 'all' ? null : new Date();
    const interval = selectedRange.label;
    dispatch({
        type: AGGREGATED_GRAPH_START,
        payload: { interval },
    });
    const promises = filteredAccounts.map(a =>
        dispatch(fetchAccountGraphData(a, startDate, endDate, selectedRange)),
    );
    await Promise.all(promises);

    dispatch({
        type: AGGREGATED_GRAPH_SUCCESS,
        payload: { interval },
    });
};
