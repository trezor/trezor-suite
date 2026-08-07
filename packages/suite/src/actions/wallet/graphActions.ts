import { type Dispatch } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { resetTime } from '@suite-common/suite-utils';
import {
    type BlockchainRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import { type AccountKey, createAccountKey } from '@suite-common/wallet-types';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { type GraphState } from 'src/reducers/wallet/graphReducer';
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
    mergeAccountBalanceHistory,
} from 'src/utils/wallet/graph';

import {
    ACCOUNT_GRAPH_FAIL,
    ACCOUNT_GRAPH_START,
    ACCOUNT_GRAPH_SUCCESS,
    AGGREGATED_GRAPH_START,
    AGGREGATED_GRAPH_SUCCESS,
    SET_SELECTED_RANGE,
} from './constants/graphConstants';

const DAY_IN_SECONDS = 3600 * 24;

type GraphRootState = { wallet: { graph: GraphState } };
type FetchAccountGraphDataThunkState = BlockchainRootState &
    GraphRootState &
    WalletSettingsRootState;

const selectAccountGraphData = (state: GraphRootState, account: Account) =>
    state.wallet.graph.data.find(
        d =>
            d.account.deviceState === account.deviceState &&
            d.account.descriptor === account.descriptor &&
            d.account.symbol === account.symbol,
    )?.data;
const selectGraph = (state: GraphRootState) => state.wallet.graph;

export type GraphAction =
    | {
          type: typeof ACCOUNT_GRAPH_SUCCESS;
          payload: GraphData;
      }
    | {
          type: typeof ACCOUNT_GRAPH_START;
          payload: Omit<GraphData, 'data'>;
      }
    | {
          type: typeof ACCOUNT_GRAPH_FAIL;
          payload: Omit<GraphData, 'data'>;
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
    async (dispatch: Dispatch<GraphAction>, getState: () => FetchAccountGraphDataThunkState) => {
        dispatch({
            type: ACCOUNT_GRAPH_START,
            payload: {
                account: {
                    deviceState: account.deviceState,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                },
                isLoading: true,
                error: false,
            },
        });

        const baseCurrencyCode = selectBaseCurrency(getState());

        const cachedData = selectAccountGraphData(getState(), account);
        // refetch one day earlier than the last cached point so the last cached bucket is always
        // recomputed, regardless of how backend bucket boundaries align with the local timezone
        const lastCachedPoint = cachedData && cachedData.length > 2 ? cachedData.at(-1) : undefined;

        const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            from: lastCachedPoint ? lastCachedPoint.time - DAY_IN_SECONDS : undefined,
            groupBy: DAY_IN_SECONDS, // day
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

            const firstFreshTime = responseWithRates[0]
                ? resetTime(responseWithRates[0].time)
                : undefined;
            const balanceBeforeFirstFreshPoint =
                lastCachedPoint && firstFreshTime !== undefined
                    ? cachedData?.filter(point => point.time < firstFreshTime).at(-1)?.balance
                    : undefined;

            const enhancedResponse = enhanceBlockchainAccountHistory(
                responseWithRates,
                account.symbol,
                balanceBeforeFirstFreshPoint,
            );

            const getData = () => {
                if (!lastCachedPoint || !cachedData) {
                    return enhancedResponse;
                }
                if (responseWithRates.length === 0 || balanceBeforeFirstFreshPoint === undefined) {
                    return cachedData;
                }

                return mergeAccountBalanceHistory(cachedData, enhancedResponse);
            };
            const data = getData();

            dispatch({
                type: ACCOUNT_GRAPH_SUCCESS,
                payload: {
                    account: {
                        deviceState: account.deviceState,
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                    },
                    data,
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
                    isLoading: false,
                    error: true,
                },
            });
        }
    };

type UpdateGraphDataThunkState = FetchAccountGraphDataThunkState;

export const updateGraphData = createThunk<
    void,
    { accounts: Account[]; abortSignal?: AbortSignal },
    { state: UpdateGraphDataThunkState }
>('wallet/updateGraphData', async ({ accounts, abortSignal }, { dispatch, getState }) => {
    const graph = selectGraph(getState());

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
});
