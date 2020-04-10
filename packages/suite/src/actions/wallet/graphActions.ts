import TrezorConnect, { BlockchainAccountBalanceHistory } from 'trezor-connect';
import { getUnixTime, subWeeks } from 'date-fns';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { resetTime } from '@suite-utils/date';
import { Dispatch, GetState } from '@suite-types';
import {
    AGGREGATED_HISTORY_UPDATE,
    AGGREGATED_HISTORY_START,
    AGGREGATED_HISTORY_SUCCESS,
    AGGREGATED_HISTORY_FAIL,
} from './constants/graphConstants';
import { Account, Network } from '@wallet-types';
import { GraphRange } from '@wallet-types/fiatRates';

export type GraphActions =
    | {
          type: typeof AGGREGATED_HISTORY_UPDATE;
          payload: {
              account: Account;
              data: BlockchainAccountBalanceHistory[];
              interval: GraphRange['label'];
          };
      }
    | { type: typeof AGGREGATED_HISTORY_START }
    | { type: typeof AGGREGATED_HISTORY_SUCCESS }
    | {
          type: typeof AGGREGATED_HISTORY_FAIL;
          payload: {
              descriptor: string;
              deviceState: string;
              symbol: Network['symbol'];
          }[];
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
            type: AGGREGATED_HISTORY_UPDATE,
            payload: {
                account,
                interval,
                data: enhancedResponse,
            },
        });
        return enhancedResponse;
    }
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

    dispatch({
        type: AGGREGATED_HISTORY_START,
    });
    const promises = accounts.map(a =>
        dispatch(fetchAccountGraphData(a, startDate, endDate, groupBy, range.label)),
    );
    const responses = await Promise.all(promises);
    const failedAccounts = responses.map((r, i) => (!r ? accounts[i] : null)).filter(a => !!a);

    if (failedAccounts.length > 0) {
        dispatch({
            type: AGGREGATED_HISTORY_FAIL,
            payload: failedAccounts.map(a => ({
                descriptor: a!.descriptor,
                symbol: a!.symbol,
                deviceState: a!.deviceState,
            })),
        });
    } else {
        dispatch({
            type: AGGREGATED_HISTORY_SUCCESS,
        });
    }
};
