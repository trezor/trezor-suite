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
    ACCOUNT_GRAPH_BATCH_SUCCESS,
    ACCOUNT_GRAPH_FAIL,
    ACCOUNT_GRAPH_START,
    ACCOUNT_GRAPH_SUCCESS,
    AGGREGATED_GRAPH_FAIL,
    AGGREGATED_GRAPH_START,
    AGGREGATED_GRAPH_SUCCESS,
    SET_SELECTED_RANGE,
} from './constants/graphConstants';

const graphPrefetchCache = new Map<string, GraphData>();
const graphPrefetchPromises = new Map<string, Promise<GraphData | undefined>>();
const graphPrefetchActiveKeys = new Set<string>();
const graphPrefetchEvictionTimers = new Map<string, ReturnType<typeof setTimeout>>();
const GRAPH_PREFETCH_EVICTION_DELAY_MS = 250;

export type GraphAction =
    | {
          type: typeof ACCOUNT_GRAPH_SUCCESS;
          payload: GraphData;
      }
    | {
          type: typeof ACCOUNT_GRAPH_BATCH_SUCCESS;
          payload: GraphData[];
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
          type: typeof AGGREGATED_GRAPH_FAIL;
      }
    | {
          type: typeof SET_SELECTED_RANGE;
          payload: GraphRange;
      };

export const setSelectedRange = (range: GraphRange): GraphAction => ({
    type: SET_SELECTED_RANGE,
    payload: range,
});

const createGraphPayload = ({
    account,
    data,
    rawData,
    isLoading,
    error,
    fetchedRange,
}: GraphData): GraphData => ({
    account,
    data,
    rawData,
    isLoading,
    error,
    fetchedRange,
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
) => {
    let from: null | number;
    if (currentRange.from === null && currentRange.to === null) {
        from = incomingRange.from;
    } else if (incomingRange.from === null && incomingRange.to === null) {
        from = currentRange.from;
    } else if (currentRange.from === null || incomingRange.from === null) {
        from = null;
    } else {
        from = Math.min(currentRange.from, incomingRange.from);
    }

    let to: null | number;
    if (currentRange.to === null) {
        to = incomingRange.to;
    } else if (incomingRange.to === null) {
        to = currentRange.to;
    } else {
        to = Math.max(currentRange.to, incomingRange.to);
    }

    return { from, to };
};

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

    const isRightMissing =
        requestedRange.to !== null && cachedRange.to !== null && cachedRange.to < requestedRange.to;
    if (isRightMissing) {
        segments.push({
            from: cachedRange.to,
            to: requestedRange.to,
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

const getGraphPrefetchKey = (account: Account, selectedRange: GraphRange) => {
    const { from, to } = getRangeParams(selectedRange);

    return [
        account.key,
        from ?? 'all',
        to ?? 'all',
        account.formattedBalance,
        account.history.total,
    ].join(':');
};

const clearGraphPrefetchEvictionTimer = (cacheKey: string) => {
    const timer = graphPrefetchEvictionTimers.get(cacheKey);

    if (timer) {
        clearTimeout(timer);
        graphPrefetchEvictionTimers.delete(cacheKey);
    }
};

const removeGraphPrefetchEntry = (cacheKey: string) => {
    clearGraphPrefetchEvictionTimer(cacheKey);
    graphPrefetchActiveKeys.delete(cacheKey);
    graphPrefetchCache.delete(cacheKey);
};

const scheduleGraphPrefetchEviction = (cacheKey: string) => {
    clearGraphPrefetchEvictionTimer(cacheKey);
    graphPrefetchActiveKeys.delete(cacheKey);

    graphPrefetchEvictionTimers.set(
        cacheKey,
        setTimeout(() => {
            graphPrefetchCache.delete(cacheKey);
            graphPrefetchEvictionTimers.delete(cacheKey);
        }, GRAPH_PREFETCH_EVICTION_DELAY_MS),
    );
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
    (
        account: Account,
        options: {
            abortSignal?: AbortSignal;
            selectedRange?: GraphRange;
            emitUpdates?: boolean;
        },
    ) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const selectedRange = options.selectedRange ?? selectGraphSelectedRange(getState());
        const emitUpdates = options.emitUpdates ?? true;
        const selectedRangeParams = getRangeParams(selectedRange);
        const graphAccount = {
            deviceState: account.deviceState,
            descriptor: account.descriptor,
            symbol: account.symbol,
        };
        const requestId = `${account.key}:${selectedRangeParams.from ?? 'all'}:${selectedRangeParams.to ?? 'all'}:${Date.now()}`;

        const enhance = (rawHistory: BlockchainAccountBalanceHistory[]) =>
            enhanceBlockchainAccountHistoryFromCurrentBalance(
                rawHistory,
                account.symbol,
                account.formattedBalance,
                selectedRangeParams.from ?? undefined,
            );

        const buildSuccessPayload = (
            rawHistory: BlockchainAccountBalanceHistory[],
            fetchedRange: { from: null | number; to: null | number },
            data: AccountHistoryWithBalance[] = enhance(rawHistory),
        ): GraphData =>
            createGraphPayload({
                account: graphAccount,
                data,
                rawData: rawHistory,
                isLoading: false,
                error: false,
                fetchedRange,
            });

        // When emitUpdates is false (prefetch), treat the request as always
        // active — the caller doesn't care about the currently-selected range.
        const isStillActive = () =>
            !emitUpdates || isRangeStillActive(getState, selectedRangeParams);

        const dispatchSuccess = (payload: GraphData) => {
            if (emitUpdates) {
                dispatch({ type: ACCOUNT_GRAPH_SUCCESS, payload });
            }
        };

        if (emitUpdates) {
            dispatch({
                type: ACCOUNT_GRAPH_START,
                payload: createGraphPayload({
                    account: graphAccount,
                    data: [],
                    rawData: [],
                    isLoading: true,
                    error: false,
                    fetchedRange: selectedRangeParams,
                }),
            });
        }

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
        const initialSegments = canIncrementallyExtendCache
            ? getMissingRangeSegments(cachedGraphEntry.fetchedRange, selectedRangeParams)
            : [selectedRangeParams];

        let mergedHistory = canIncrementallyExtendCache ? cachedGraphEntry.rawData : [];
        let mergedFetchedRange = canIncrementallyExtendCache
            ? cachedGraphEntry.fetchedRange
            : getCoverageRange(mergedHistory, selectedRangeParams);

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
                if (!isStillActive()) return;

                progressiveHistory = mergeBalanceHistory(progressiveHistory, event.progress.data);
                const displayRawHistory = mergeBalanceHistory(mergedHistory, progressiveHistory);

                dispatch({
                    type: ACCOUNT_GRAPH_START,
                    payload: {
                        account: graphAccount,
                        data: enhance(displayRawHistory),
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

            if (emitUpdates) {
                TrezorConnect.on(BLOCKCHAIN.ACCOUNT_GRAPH_PROGRESS, onProgress);
            }

            const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
                descriptor: account.descriptor,
                ...(rangeParams.from !== null ? { from: rangeParams.from } : {}),
                ...(rangeParams.to !== null ? { to: rangeParams.to } : {}),
                groupBy: 3600 * 24, // day
                requestId: segmentRequestId,
            }).finally(() => {
                if (emitUpdates) {
                    TrezorConnect.off(BLOCKCHAIN.ACCOUNT_GRAPH_PROGRESS, onProgress);
                }
            });

            options.abortSignal?.throwIfAborted();

            if (!response.success) {
                return response;
            }

            const combinedSegmentHistory = mergeBalanceHistory(
                progressiveHistory,
                response.payload,
            );
            mergedHistory = mergeBalanceHistory(mergedHistory, combinedSegmentHistory);
            mergedFetchedRange = mergeFetchedRanges(
                mergedFetchedRange,
                getCoverageRange(combinedSegmentHistory, rangeParams),
            );

            if (isStillActive()) {
                dispatchSuccess(buildSuccessPayload(mergedHistory, mergedFetchedRange));
            }

            return response;
        };

        const runSegmentLoop = async () => {
            const pendingSegments = [...initialSegments];
            let segmentIndex = 0;

            while (pendingSegments.length > 0) {
                const segment = pendingSegments.shift()!;
                const previousFetchedRangeFrom = mergedFetchedRange.from;
                const response = await fetchSegment(segment, segmentIndex);

                if (!isStillActive()) {
                    return { status: 'cancelled' as const };
                }

                if (!response.success) {
                    return { status: 'failed' as const, response };
                }

                // When requesting with no lower bound, keep probing backwards
                // as long as the backend returns older data than we already had.
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
                        pendingSegments.push({ from: null, to: nextFetchedRangeFrom });
                    } else {
                        mergedFetchedRange = {
                            ...mergedFetchedRange,
                            from: FULL_LEFT_COVERAGE_SENTINEL,
                        };
                    }
                }

                segmentIndex++;
            }

            return { status: 'done' as const };
        };

        const loopResult = await runSegmentLoop();
        if (loopResult.status === 'cancelled') return;
        if (!isStillActive()) return;

        // Failure finalization: fall back to partial history if we have any;
        // otherwise report a hard failure. Prefetch (emitUpdates=false) never
        // caches a partially-failed fetch — return undefined so the caller
        // doesn't persist it.
        if (loopResult.status === 'failed') {
            if (emitUpdates) {
                if (mergedHistory.length > 0) {
                    const payload = buildSuccessPayload(mergedHistory, mergedFetchedRange);
                    dispatch({ type: ACCOUNT_GRAPH_SUCCESS, payload });

                    return payload;
                }

                dispatch({
                    type: ACCOUNT_GRAPH_FAIL,
                    payload: createGraphPayload({
                        account: graphAccount,
                        data: [],
                        rawData: [],
                        isLoading: false,
                        error: true,
                        fetchedRange: selectedRangeParams,
                    }),
                });
            }

            return;
        }

        // The new balance graph uses a separate graph-fiat pipeline; skip the
        // legacy per-point CoinGecko rate enrichment.
        const isNewBalanceGraphEnabled =
            selectHasExperimentalFeature('new-balance-graph')(getState());

        if (isNewBalanceGraphEnabled) {
            const payload = buildSuccessPayload(mergedHistory, mergedFetchedRange);
            dispatchSuccess(payload);

            return payload;
        }

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        try {
            const responseWithRates = await ensureHistoryRates(
                account.symbol,
                mergedHistory,
                baseCurrencyCode,
                isElectrumBackend,
            );

            if (!isStillActive()) return;

            const payload = buildSuccessPayload(responseWithRates, mergedFetchedRange);
            dispatchSuccess(payload);

            return payload;
        } catch (error) {
            console.warn(
                `[graphActions] rate enrichment for ${account.symbol} failed; keeping raw graph data`,
                error,
            );

            const payload = buildSuccessPayload(mergedHistory, mergedFetchedRange);
            dispatchSuccess(payload);

            return payload;
        }
    };

export const prefetchGraphData = createThunk<
    void,
    { accounts: Account[]; selectedRange: GraphRange },
    void
>(
    'wallet/prefetchGraphData',
    async (
        { accounts, selectedRange },
        {
            dispatch,
            getState,
        }: {
            dispatch: Dispatch;
            getState: GetState;
        },
    ) => {
        if (!selectHasExperimentalFeature('new-balance-graph')(getState())) {
            return;
        }

        const supportedAccounts = accounts.filter(
            a =>
                isTrezorConnectBackendType(a.backendType) &&
                isNetworkWithGraphFeature(a.symbol, a.backendType),
        );

        await Promise.allSettled(
            supportedAccounts.map(async account => {
                const cacheKey = getGraphPrefetchKey(account, selectedRange);

                graphPrefetchActiveKeys.add(cacheKey);
                clearGraphPrefetchEvictionTimer(cacheKey);

                if (graphPrefetchCache.has(cacheKey) || graphPrefetchPromises.has(cacheKey)) {
                    return;
                }

                const promise = Promise.resolve(
                    dispatch(
                        fetchAccountGraphData(account, {
                            selectedRange,
                            emitUpdates: false,
                        }),
                    ),
                )
                    .then(payload => {
                        if (payload && graphPrefetchActiveKeys.has(cacheKey)) {
                            graphPrefetchCache.set(cacheKey, payload);
                        }

                        return payload;
                    })
                    .finally(() => {
                        graphPrefetchPromises.delete(cacheKey);
                    });

                graphPrefetchPromises.set(cacheKey, promise);

                await promise;
            }),
        );
    },
);

export const evictPrefetchedGraphData = createThunk<
    void,
    { accounts: Account[]; selectedRange: GraphRange },
    void
>('wallet/evictPrefetchedGraphData', ({ accounts, selectedRange }) => {
    accounts.forEach(account => {
        scheduleGraphPrefetchEviction(getGraphPrefetchKey(account, selectedRange));
    });
});

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

        const prefetchedPayloads = new Map<AccountKey, GraphData>();
        supportedAccounts.forEach(account => {
            const cacheKey = getGraphPrefetchKey(account, effectiveSelectedRange);

            clearGraphPrefetchEvictionTimer(cacheKey);

            const prefetchedPayload = graphPrefetchCache.get(cacheKey);
            if (prefetchedPayload) {
                prefetchedPayloads.set(account.key, prefetchedPayload);
                removeGraphPrefetchEntry(cacheKey);

                return;
            }

            if (graphPrefetchPromises.get(cacheKey)) {
                removeGraphPrefetchEntry(cacheKey);
            }
        });

        if (prefetchedPayloads.size > 0) {
            dispatch({
                type: ACCOUNT_GRAPH_BATCH_SUCCESS,
                payload: Array.from(prefetchedPayloads.values()),
            });
        }

        const graphTxCountByAccount = new Map<AccountKey, number>(
            Array.from(graphEntriesByAccount.entries()).map(([key, entry]) => {
                const txCount = entry.data.reduce((acc, point) => acc + point.txs, 0);

                return [key, txCount];
            }),
        );

        const accountsToFetch = supportedAccounts.filter(account => {
            if (prefetchedPayloads.has(account.key)) {
                return false;
            }

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

                const requiresStableLatestBucketTxCount =
                    account.symbol !== 'sol' && account.history.total !== -1;

                if (
                    !coversLatestKnownBucket ||
                    (requiresStableLatestBucketTxCount && !hasCurrentLatestBucketTxCount)
                ) {
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

            const hasFullHistoryCache = cachedGraph.fetchedRange.from === null;

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
            // Aborts are not failures — the caller intentionally cancelled.
            if (error instanceof Error && error.name === 'AbortError') {
                dispatch({
                    type: AGGREGATED_GRAPH_SUCCESS,
                });

                return;
            }

            console.error('[graphActions] updateGraphData failed', error);
            dispatch({
                type: AGGREGATED_GRAPH_FAIL,
            });
        }
    },
);
