import { selectHasExperimentalFeature } from '@suite/settings';
import { createThunk } from '@suite-common/redux-utils';
import { resetTime } from '@suite-common/suite-utils';
import { selectBaseCurrency, selectIsElectrumBackendSelected } from '@suite-common/wallet-core';
import { type AccountKey, createAccountKey } from '@suite-common/wallet-types';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect, {
    BLOCKCHAIN,
    type BlockchainAccountBalanceHistory,
    type BlockchainAccountGraphProgress,
} from '@trezor/connect';

import { type Dispatch, type GetState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import {
    type AccountHistoryWithBalance,
    type AccountIdentifier,
    type GraphData,
    type GraphRange,
} from 'src/types/wallet/graph';
import {
    enhanceBlockchainAccountHistoryFromCurrentBalance,
    ensureHistoryRates,
    isNetworkWithGraphFeature,
    isNetworkWithLegacyGraphFeature,
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

const mergeBalanceHistory = <T extends { time: number }>(current: T[], incoming: T[]) => {
    const byTime = new Map<number, T>();

    current.forEach(point => {
        byTime.set(point.time, point);
    });
    incoming.forEach(point => {
        byTime.set(point.time, point);
    });

    return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
};

const getCoverageRange = (
    history: BlockchainAccountBalanceHistory[],
    fallbackRange: { from: null | number; to: null | number },
) =>
    history.length > 0
        ? {
              from: history[0].time,
              to: history[history.length - 1].time,
          }
        : fallbackRange;

const mergeFetchedRanges = (
    currentRange: { from: null | number; to: null | number },
    incomingRange: { from: null | number; to: null | number },
) => ({
    from:
        currentRange.from === null || incomingRange.from === null
            ? null
            : Math.min(currentRange.from, incomingRange.from),
    to:
        currentRange.to === null || incomingRange.to === null
            ? null
            : Math.max(currentRange.to, incomingRange.to),
});

const getMissingRangeSegments = (
    cachedRange: { from: null | number; to: null | number },
    requestedRange: { from: null | number; to: null | number },
) => {
    const segments: Array<{ from: null | number; to: null | number }> = [];

    const isLeftMissing =
        cachedRange.from !== null &&
        (requestedRange.from === null || cachedRange.from > requestedRange.from);
    if (isLeftMissing) {
        segments.push({
            from: requestedRange.from,
            to: cachedRange.from,
        });
    }

    return segments;
};

const FULL_LEFT_COVERAGE_SENTINEL = null;

const getRangeParams = (selectedRange: GraphRange) =>
    selectedRange.label === 'all'
        ? { from: null, to: null }
        : {
              from: Math.floor(selectedRange.startDate.getTime() / 1000),
              to: Math.ceil(selectedRange.endDate.getTime() / 1000),
          };

const getCoverageRangeParams = (selectedRange: GraphRange) =>
    selectedRange.label === 'all'
        ? { from: null, to: null }
        : {
              from: resetTime(Math.floor(selectedRange.startDate.getTime() / 1000)),
              to: resetTime(Math.ceil(selectedRange.endDate.getTime() / 1000)),
          };

const getLatestTransactionBucketInfo = (
    account: Account,
    selectedRangeCoverage: { from: null | number; to: null | number },
) => {
    const { to } = selectedRangeCoverage;

    if (to === null) {
        return undefined;
    }

    const transactions = account.history.transactions ?? [];
    const boundedTransactions = transactions.filter(tx => {
        if (!tx.blockTime) {
            return false;
        }

        if (selectedRangeCoverage.from !== null && tx.blockTime < selectedRangeCoverage.from) {
            return false;
        }

        return tx.blockTime <= to;
    });

    if (boundedTransactions.length === 0) {
        return undefined;
    }

    const latestBucketTime = Math.max(...boundedTransactions.map(tx => resetTime(tx.blockTime!)));
    const latestBucketTxs = boundedTransactions.reduce(
        (count, tx) => count + (resetTime(tx.blockTime!) === latestBucketTime ? 1 : 0),
        0,
    );

    return {
        latestBucketTime,
        latestBucketTxs,
    };
};

const selectGraphSelectedRange = (state: ReturnType<GetState>) => state.wallet.graph.selectedRange;
const selectGraphState = (state: ReturnType<GetState>) => state.wallet.graph;
const findGraphEntryForAccount = (graphData: GraphData[], account: AccountIdentifier) =>
    graphData.find(
        entry =>
            entry.account.deviceState === account.deviceState &&
            entry.account.descriptor === account.descriptor &&
            entry.account.symbol === account.symbol,
    );

const isRangeStillActive = (
    getState: GetState,
    rangeParams: { from: null | number; to: null | number },
) => {
    const activeRange = getRangeParams(selectGraphSelectedRange(getState()));

    return activeRange.from === rangeParams.from && activeRange.to === rangeParams.to;
};

/**
 * Fetch the account history (received, sent amounts, num of txs) for the given `startDate`, `endDate`.
 * Returned data are grouped by `groupBy` seconds
 * No XRP and SOL support
 *
 * @param {Account} account
 * @returns
 */
export const fetchAccountGraphData =
    (account: Account, options: { abortSignal?: AbortSignal; selectedRange?: GraphRange }) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const selectedRange = options.selectedRange ?? selectGraphSelectedRange(getState());
        const selectedRangeParams = getRangeParams(selectedRange);
        const requestRangeParams = selectedRangeParams;
        const graphAccount = {
            deviceState: account.deviceState,
            descriptor: account.descriptor,
            symbol: account.symbol,
        };
        const requestId = `${account.key}:${selectedRangeParams.from ?? 'all'}:${selectedRangeParams.to ?? 'all'}:${Date.now()}`;

        dispatch({
            type: ACCOUNT_GRAPH_START,
            payload: {
                account: graphAccount,
                data: [],
                rawData: [],
                isLoading: true,
                error: false,
                fetchedRange: requestRangeParams,
            },
        });

        const baseCurrencyCode = selectBaseCurrency(getState());
        const cachedGraphEntry = findGraphEntryForAccount(
            selectGraphState(getState()).data,
            graphAccount,
        );
        const canIncrementallyExtendCache =
            !!cachedGraphEntry &&
            !cachedGraphEntry.error &&
            cachedGraphEntry.rawData.length > 0 &&
            cachedGraphEntry.fetchedRange.to !== null;
        const requestedSegments = canIncrementallyExtendCache
            ? getMissingRangeSegments(cachedGraphEntry.fetchedRange, requestRangeParams)
            : [requestRangeParams];

        let mergedHistory = canIncrementallyExtendCache ? cachedGraphEntry.rawData : [];
        let mergedFetchedRange = canIncrementallyExtendCache
            ? cachedGraphEntry.fetchedRange
            : getCoverageRange(mergedHistory, requestRangeParams);

        const fetchSegment = async (
            rangeParams: { from: null | number; to: null | number },
            segmentIndex: number,
        ) => {
            let progressiveHistory: BlockchainAccountBalanceHistory[] = [];
            const segmentRequestId = `${requestId}:${segmentIndex}`;
            const onProgress = (event: BlockchainAccountGraphProgress) => {
                if (
                    event.coin.shortcut.toLowerCase() !== account.symbol ||
                    event.progress.descriptor !== account.descriptor ||
                    event.progress.requestId !== segmentRequestId
                ) {
                    return;
                }
                if (!isRangeStillActive(getState, selectedRangeParams)) {
                    return;
                }

                progressiveHistory = mergeBalanceHistory(progressiveHistory, event.progress.data);
                const displayRawHistory = mergeBalanceHistory(mergedHistory, progressiveHistory);
                const enhancedDisplayHistory = enhanceBlockchainAccountHistoryFromCurrentBalance(
                    displayRawHistory,
                    account.symbol,
                    account.formattedBalance,
                    selectedRangeParams.from ?? undefined,
                );

                dispatch({
                    type: ACCOUNT_GRAPH_START,
                    payload: {
                        account: graphAccount,
                        data: enhancedDisplayHistory,
                        rawData: displayRawHistory,
                        isLoading: true,
                        error: false,
                        fetchedRange: mergeFetchedRanges(
                            mergedFetchedRange,
                            getCoverageRange(progressiveHistory, rangeParams),
                        ),
                    },
                });
            };

            TrezorConnect.on(BLOCKCHAIN.ACCOUNT_GRAPH_PROGRESS, onProgress);

            const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
                descriptor: account.descriptor,
                ...(rangeParams.from !== null ? { from: rangeParams.from } : {}),
                ...(rangeParams.to !== null ? { to: rangeParams.to } : {}),
                groupBy: 3600 * 24, // day
                requestId: segmentRequestId,
            }).finally(() => {
                TrezorConnect.off(BLOCKCHAIN.ACCOUNT_GRAPH_PROGRESS, onProgress);
            });

            options.abortSignal?.throwIfAborted();

            if (!response.success) {
                return response;
            }

            mergedHistory = mergeBalanceHistory(
                mergedHistory,
                mergeBalanceHistory(progressiveHistory, response.payload),
            );
            mergedFetchedRange = mergeFetchedRanges(
                mergedFetchedRange,
                getCoverageRange(
                    mergeBalanceHistory(progressiveHistory, response.payload),
                    rangeParams,
                ),
            );

            if (!isRangeStillActive(getState, selectedRangeParams)) {
                return response;
            }

            const enhancedResponse = enhanceBlockchainAccountHistoryFromCurrentBalance(
                mergedHistory,
                account.symbol,
                account.formattedBalance,
                selectedRangeParams.from ?? undefined,
            );

            dispatch({
                type: ACCOUNT_GRAPH_SUCCESS,
                payload: {
                    account: graphAccount,
                    data: enhancedResponse,
                    rawData: mergedHistory,
                    isLoading: false,
                    error: false,
                    fetchedRange: mergedFetchedRange,
                },
            });

            return response;
        };

        let failedResponse:
            | Awaited<ReturnType<typeof TrezorConnect.blockchainGetAccountBalanceHistory>>
            | undefined;
        const pendingSegments = [...requestedSegments];
        let segmentIndex = 0;

        while (pendingSegments.length > 0) {
            const segment = pendingSegments.shift()!;
            const previousFetchedRangeFrom = mergedFetchedRange.from;
            const response = await fetchSegment(segment, segmentIndex);

            if (!isRangeStillActive(getState, selectedRangeParams)) {
                return;
            }

            if (!response.success) {
                failedResponse = response;
                break;
            }

            if (selectedRangeParams.from === null && segment.from === null) {
                const nextFetchedRangeFrom = mergedFetchedRange.from;
                const hasBackfilledOlderRange =
                    previousFetchedRangeFrom !== null &&
                    nextFetchedRangeFrom !== null &&
                    nextFetchedRangeFrom < previousFetchedRangeFrom;
                const shouldProbeForOlderData =
                    previousFetchedRangeFrom === null
                        ? nextFetchedRangeFrom !== null
                        : hasBackfilledOlderRange;

                if (shouldProbeForOlderData) {
                    pendingSegments.push({
                        from: null,
                        to: nextFetchedRangeFrom,
                    });
                } else {
                    mergedFetchedRange = {
                        ...mergedFetchedRange,
                        from: FULL_LEFT_COVERAGE_SENTINEL,
                    };
                }
            }

            segmentIndex++;
        }

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        if (!isRangeStillActive(getState, selectedRangeParams)) {
            return;
        }

        if (!failedResponse) {
            try {
                const responseWithRates = await ensureHistoryRates(
                    account.symbol,
                    mergedHistory,
                    baseCurrencyCode,
                    isElectrumBackend,
                );

                if (!isRangeStillActive(getState, selectedRangeParams)) {
                    return;
                }

                const enhancedResponseWithRates = enhanceBlockchainAccountHistoryFromCurrentBalance(
                    responseWithRates,
                    account.symbol,
                    account.formattedBalance,
                    selectedRangeParams.from ?? undefined,
                );

                dispatch({
                    type: ACCOUNT_GRAPH_SUCCESS,
                    payload: {
                        account: graphAccount,
                        data: enhancedResponseWithRates,
                        rawData: responseWithRates,
                        isLoading: false,
                        error: false,
                        fetchedRange: mergedFetchedRange,
                    },
                });
            } catch (error) {
                console.warn(
                    `[graphActions] rate enrichment for ${account.symbol} failed; keeping raw graph data`,
                    error,
                );
            }
        } else {
            if (!isRangeStillActive(getState, selectedRangeParams)) {
                return;
            }

            dispatch({
                type: ACCOUNT_GRAPH_FAIL,
                payload: {
                    account: graphAccount,
                    data: [],
                    rawData: [],
                    isLoading: false,
                    error: true,
                    fetchedRange: requestRangeParams,
                },
            });
        }
    };

export const updateGraphData = createThunk<
    void,
    { accounts: Account[]; abortSignal?: AbortSignal; selectedRange?: GraphRange },
    void
>(
    'wallet/updateGraphData',
    async (
        { accounts, abortSignal, selectedRange },
        {
            dispatch,
            getState,
        }: {
            dispatch: Dispatch;
            getState: GetState;
        },
    ) => {
        const graph = selectGraphState(getState());
        const effectiveSelectedRange = selectedRange ?? graph.selectedRange;
        const isNewBalanceGraphEnabled =
            selectHasExperimentalFeature('new-balance-graph')(getState());
        const isGraphSupported = isNewBalanceGraphEnabled
            ? isNetworkWithGraphFeature
            : isNetworkWithLegacyGraphFeature;

        const supportedAccounts = accounts.filter(
            a =>
                isTrezorConnectBackendType(a.backendType) &&
                isGraphSupported(a.symbol, a.backendType),
        );

        const graphEntriesByAccount = new Map<
            AccountKey,
            {
                data: AccountHistoryWithBalance[];
                rawData: BlockchainAccountBalanceHistory[];
                error: boolean;
                fetchedRange: { from: null | number; to: null | number };
                isLoading: boolean;
            }
        >(
            graph.data.map(({ account, data, rawData, error, fetchedRange, isLoading }) => [
                createAccountKey({
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                    deviceStaticSessionId: account.deviceState,
                }),
                { data, rawData, error, fetchedRange, isLoading },
            ]),
        );

        const graphTxCountByAccount = new Map<AccountKey, number>(
            Array.from(graphEntriesByAccount.entries()).map(([key, entry]) => {
                const txCount = entry.data.reduce((acc, point) => acc + point.txs, 0);

                return [key, txCount];
            }),
        );

        const accountsToFetch = supportedAccounts.filter(account => {
            const cachedGraph = graphEntriesByAccount.get(account.key);
            if (cachedGraph?.isLoading) {
                return false;
            }

            if (!cachedGraph || cachedGraph.error || cachedGraph.data.length === 0) {
                return true;
            }

            // Legacy graph cache entries may contain only rendered/enhanced
            // data without the raw backend history needed for trustworthy
            // range coverage checks. Refetch them once and rewrite the cache
            // in the new shape instead of reusing partial coverage forever.
            if (cachedGraph.rawData.length === 0) {
                return true;
            }

            const selectedRangeCoverage = getCoverageRangeParams(effectiveSelectedRange);

            const coversSelectedRange =
                cachedGraph.fetchedRange.from === null
                    ? true
                    : selectedRangeCoverage.from !== null &&
                      cachedGraph.fetchedRange.from <= selectedRangeCoverage.from;

            if (!coversSelectedRange) {
                return true;
            }

            const latestTransactionBucketInfo = getLatestTransactionBucketInfo(
                account,
                selectedRangeCoverage,
            );
            if (latestTransactionBucketInfo) {
                const latestCachedBucket = cachedGraph.data[cachedGraph.data.length - 1];
                const coversLatestKnownBucket =
                    cachedGraph.fetchedRange.to !== null &&
                    cachedGraph.fetchedRange.to >= latestTransactionBucketInfo.latestBucketTime;
                const hasCurrentLatestBucketTxCount =
                    latestCachedBucket?.time === latestTransactionBucketInfo.latestBucketTime &&
                    latestCachedBucket.txs >= latestTransactionBucketInfo.latestBucketTxs;

                if (!coversLatestKnownBucket || !hasCurrentLatestBucketTxCount) {
                    return true;
                }
            }

            // Some backends cannot provide a stable full transaction total for
            // graph invalidation. Solana account history.total includes
            // recognized token-account transactions, while Ripple returns -1.
            // In both cases, if the cached graph already covers the selected
            // range, keep it instead of forcing a refetch on every switch.
            if (account.symbol === 'sol' || account.history.total === -1) {
                return false;
            }

            const hasFullHistoryCache =
                cachedGraph.fetchedRange.from === null && cachedGraph.fetchedRange.to === null;

            if (!hasFullHistoryCache) {
                return false;
            }

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
                        selectedRange,
                    }),
                ),
            );
            await Promise.all(promises);

            abortSignal?.throwIfAborted();

            dispatch({
                type: AGGREGATED_GRAPH_SUCCESS,
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                dispatch({
                    type: AGGREGATED_GRAPH_SUCCESS,
                });
            } else {
                console.error('[graphActions] updateGraphData failed', error);
                dispatch({
                    type: AGGREGATED_GRAPH_SUCCESS,
                });
            }
        }
    },
);
