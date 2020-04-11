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
      };

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
    startDate: Date,
    endDate: Date,
    groupBy: number,
    interval: GraphRange['label'],
) => async (dispatch: Dispatch, _getState: GetState) => {
    dispatch({
        type: ACCOUNT_GRAPH_START,
        payload: {
            account,
            interval,
        },
    });

    const secondsInMonth = 3600 * 24 * 30;
    const setDayToFirstOfMonth = groupBy >= secondsInMonth;
    const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
        coin: account.symbol,
        descriptor: account.descriptor,
        from: getUnixTime(startDate),
        to: getUnixTime(endDate),
        groupBy,
    });

    // console.log('fetching account history ', account.descriptor);

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

export const updateGraphData = (accounts: Account[], range: GraphRange) => async (
    dispatch: Dispatch,
) => {
    const startDate = subWeeks(new Date(), range.weeks);
    const endDate = new Date();
    const secondsInDay = 3600 * 24;
    const secondsInMonth = secondsInDay * 30;
    const groupBy = range.weeks >= 52 ? secondsInMonth : secondsInDay;

    const interval = range.label;
    dispatch({
        type: AGGREGATED_GRAPH_START,
        payload: { interval },
    });
    const promises = accounts.map(a =>
        dispatch(fetchAccountGraphData(a, startDate, endDate, groupBy, range.label)),
    );
    await Promise.all(promises);

    dispatch({
        type: AGGREGATED_GRAPH_SUCCESS,
        payload: { interval },
    });
};
