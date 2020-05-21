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
    if (range.weeks) {
        intervalParams = {
            from: getUnixTime(startDate!),
            to: getUnixTime(endDate!),
        };
    }

    // const setDayToFirstOfMonth = groupBy >= secondsInMonth;
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        groupBy: 3600 * 24, // day
        ...intervalParams,
    });

    if (response?.success) {
        console.log('response.payload', response.payload);

        const enhancedResponse = response.payload.map(h => {
            // @ts-ignore TODO: remove ignore when types are updated in connect
            const normalizedReceived = h.sentToSelf
                ? // prettier-ignore
                  // @ts-ignore
                  new BigNumber(h.received).minus(h.sentToSelf || 0).toFixed()
                : h.received;
            // @ts-ignore
            const normalizedSent = h.sentToSelf
                ? // prettier-ignore
                  // @ts-ignore
                  new BigNumber(h.sent).minus(h.sentToSelf || 0).toFixed()
                : h.sent;

            return {
                ...h,
                received: formatNetworkAmount(normalizedReceived, account.symbol),
                sent: formatNetworkAmount(normalizedSent, account.symbol),
                time: resetTime(h.time),
            };
        });
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
