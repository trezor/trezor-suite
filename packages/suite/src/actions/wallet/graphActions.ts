import { createThunk } from '@suite-common/redux-utils';
import { selectBaseCurrency, selectIsElectrumBackendSelected } from '@suite-common/wallet-core';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { Dispatch, GetState } from 'src/types/suite';
import { Account } from 'src/types/wallet';
import { GraphData, GraphRange, GraphScale } from 'src/types/wallet/graph';
import {
    accountGraphDataFilterFn,
    enhanceBlockchainAccountHistory,
    ensureHistoryRates,
} from 'src/utils/wallet/graph';

import {
    ACCOUNT_GRAPH_FAIL,
    ACCOUNT_GRAPH_START,
    ACCOUNT_GRAPH_SUCCESS,
    AGGREGATED_GRAPH_START,
    AGGREGATED_GRAPH_SUCCESS,
    SET_SELECTED_RANGE,
    SET_SELECTED_VIEW,
} from './constants/graphConstants';

export type GraphAction =
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
          payload: GraphScale;
      };

export const setSelectedRange = (range: GraphRange): GraphAction => ({
    type: SET_SELECTED_RANGE,
    payload: range,
});

export const setSelectedView = (view: GraphScale): GraphAction => ({
    type: SET_SELECTED_VIEW,
    payload: view,
});

/**
 * Fetch the account history (received, sent amounts, num of txs) for the given `startDate`, `endDate`.
 * Returned data are grouped by `groupBy` seconds
 * No XRP and SOL support
 *
 * @param {Account} account
 * @returns
 */
export const fetchAccountGraphData =
    (account: Account, options: { abortSignal?: AbortSignal }) =>
    async (dispatch: Dispatch, getState: GetState) => {
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

        const baseCurrencyCode = selectBaseCurrency(getState());
        const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin: account.symbol,
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            groupBy: 3600 * 24, // day
        });

        options.abortSignal?.throwIfAborted();

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        if (response?.success) {
            const responseWithRates = await ensureHistoryRates(
                account.symbol,
                response.payload,
                baseCurrencyCode,
                isElectrumBackend,
            );

            const enhancedResponse = enhanceBlockchainAccountHistory(
                responseWithRates,
                account.symbol,
            );

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

export const updateGraphData = createThunk<
    void,
    { accounts: Account[]; newAccountsOnly?: boolean; abortSignal?: AbortSignal },
    void
>(
    'wallet/updateGraphData',
    async (
        { accounts, newAccountsOnly, abortSignal },
        {
            dispatch,
            getState,
        }: {
            dispatch: Dispatch;
            getState: GetState;
        },
    ) => {
        const { graph } = getState().wallet;

        // TODO: default behaviour should be fetch only new data (since last timestamp)
        // exclude accounts with unsupported backend type
        let filteredAccounts = accounts.filter(a => isTrezorConnectBackendType(a.backendType));
        if (newAccountsOnly) {
            // add only accounts for which we don't have any data for given interval
            filteredAccounts = filteredAccounts.filter(
                account => !graph.data.find(d => accountGraphDataFilterFn(d, account)),
            );
        }
        if (filteredAccounts.length === 0) {
            return;
        }

        try {
            dispatch({
                type: AGGREGATED_GRAPH_START,
            });
            const promises = filteredAccounts.map(
                a => dispatch(fetchAccountGraphData(a, { abortSignal })), // fetch for all range
            );
            await Promise.all(promises);

            abortSignal?.throwIfAborted();

            dispatch({
                type: AGGREGATED_GRAPH_SUCCESS,
            });

            return;
        } catch (error) {
            if (error.name === 'AbortError') {
                dispatch({
                    type: AGGREGATED_GRAPH_SUCCESS,
                });
            }

            return;
        }
    },
);
