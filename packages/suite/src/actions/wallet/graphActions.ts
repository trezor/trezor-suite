import { createThunk } from '@suite-common/redux-utils';
import { selectBaseCurrency, selectIsElectrumBackendSelected } from '@suite-common/wallet-core';
import { type AccountKey, createAccountKey } from '@suite-common/wallet-types';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { type Dispatch, type GetState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import {
    type AccountHistoryWithBalance,
    type GraphData,
    type GraphRange,
} from 'src/types/wallet/graph';
import {
    enhanceBlockchainAccountHistory,
    ensureHistoryRates,
    isNetworkWithGraphFeature,
} from 'src/utils/wallet/graph';

import {
    ACCOUNT_GRAPH_FAIL,
    ACCOUNT_GRAPH_START,
    ACCOUNT_GRAPH_SUCCESS,
    AGGREGATED_GRAPH_START,
    AGGREGATED_GRAPH_SUCCESS,
    SET_SELECTED_RANGE,
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
      };

export const setSelectedRange = (range: GraphRange): GraphAction => ({
    type: SET_SELECTED_RANGE,
    payload: range,
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
    { accounts: Account[]; abortSignal?: AbortSignal },
    void
>(
    'wallet/updateGraphData',
    async (
        { accounts, abortSignal },
        {
            dispatch,
            getState,
        }: {
            dispatch: Dispatch;
            getState: GetState;
        },
    ) => {
        const { graph } = getState().wallet;

        const supportedAccounts = accounts.filter(
            a =>
                isTrezorConnectBackendType(a.backendType) &&
                isNetworkWithGraphFeature(a.symbol, a.backendType),
        );

        const graphDataPointsByAccount = new Map<AccountKey, AccountHistoryWithBalance[]>(
            graph.data.map(({ account, data }) => [
                createAccountKey({
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                    deviceStaticSessionId: account.deviceState,
                }),
                data,
            ]),
        );

        const graphTxCountByAccount = new Map<AccountKey, number>(
            Array.from(graphDataPointsByAccount.entries()).map(([key, data]) => {
                const txCount = data.reduce((acc, point) => acc + point.txs, 0);

                return [key, txCount];
            }),
        );

        const accountsToFetch = supportedAccounts.filter(account => {
            const txCount = graphTxCountByAccount.get(account.key) ?? 0;

            return txCount !== account.history.total;
        });

        if (accountsToFetch.length === 0) {
            return;
        }

        try {
            dispatch({
                type: AGGREGATED_GRAPH_START,
            });
            const promises = accountsToFetch.map(a =>
                dispatch(
                    fetchAccountGraphData(a, {
                        abortSignal,
                    }),
                ),
            );
            await Promise.all(promises);

            abortSignal?.throwIfAborted();

            dispatch({
                type: AGGREGATED_GRAPH_SUCCESS,
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                dispatch({
                    type: AGGREGATED_GRAPH_SUCCESS,
                });
            }
        }
    },
);
