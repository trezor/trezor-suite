import TrezorConnect, { BlockchainAccountBalanceHistory } from 'trezor-connect';
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

export type GraphActions =
    | {
          type: typeof ACCOUNT_GRAPH_SUCCESS;
          payload: {
              account: Account;
              data: BlockchainAccountBalanceHistory[];
              interval: GraphRange['label'];
          };
      }
    | {
          type: typeof ACCOUNT_GRAPH_START;
          payload: {
              account: Account;
              interval: GraphRange['label'];
          };
      }
    | {
          type: typeof ACCOUNT_GRAPH_FAIL;
          payload: {
              account: Account;
              interval: GraphRange['label'];
          };
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
            account,
            interval,
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
                account,
                interval,
                data: enhancedResponse,
            },
        });
        return enhancedResponse;
    }
    dispatch({
        type: ACCOUNT_GRAPH_FAIL,
        payload: {
            account,
            interval,
        },
    });
    return null;
};

export const updateGraphData = (accounts: Account[]) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedRange } = getState().wallet.graph;

    const startDate =
        selectedRange.label === 'all' ? null : subWeeks(new Date(), selectedRange.weeks!);
    const endDate = selectedRange.label === 'all' ? null : new Date();
    const interval = selectedRange.label;
    dispatch({
        type: AGGREGATED_GRAPH_START,
        payload: { interval },
    });
    const promises = accounts.map(a =>
        dispatch(fetchAccountGraphData(a, startDate, endDate, selectedRange)),
    );
    await Promise.all(promises);

    dispatch({
        type: AGGREGATED_GRAPH_SUCCESS,
        payload: { interval },
    });
};
