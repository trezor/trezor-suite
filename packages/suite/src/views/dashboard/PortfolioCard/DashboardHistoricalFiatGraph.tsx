import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { Liveline } from '@seibei-iguchi/liveline';
import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { getGraphFiatCoinId } from '@suite-common/fiat-services';
import { selectBaseCurrency, selectEnabledNetworks } from '@suite-common/wallet-core';
import { type GraphFiatResolution } from '@suite-common/wallet-types';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { removeGraphFiatResolutionsFromMemory } from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useGraph, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { type GraphData } from 'src/types/wallet/graph';
import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';

import {
    HISTORICAL_GRAPH_PADDING,
    HISTORICAL_GRAPH_TYPOGRAPHY,
    LIVELINE_WINDOW_TRANSITION_MS,
    aggregateBalanceStepSets,
    appendCurrentBalance,
    buildAlignedPortfolioSeriesFromCoinSeries,
    buildBalanceSteps,
    buildCoinHistoricalSeries,
    createGraphFiatFormatter,
    formatGraphTime,
    getAllWindowSecs,
    getRangeBounds,
    getRangeKey,
    mergeHistoricalGraphData,
} from './graphViewUtils';
import type { BalanceEntry, GraphDataPoint } from './graphViewUtils';
import { usePriceHistories } from './usePriceHistory';
import { useResolutionTransition } from './useResolutionTransition';

type CoinBalanceSource = {
    currentOnlyBalance: number;
    stepSets: BalanceEntry[][];
};

type DashboardHistoricalFiatGraphProps = {
    accounts: Account[];
    fallback: ReactNode;
    isGraphLoading: boolean;
};

const selectGraphData = (state: AppState) => state.wallet.graph.data;
const buildCoinBalanceSources = ({
    accounts,
    graphData,
}: {
    accounts: Account[];
    graphData: readonly GraphData[];
}) => {
    const sourcesByCoinId = new Map<string, CoinBalanceSource>();

    accounts.forEach(account => {
        const coinId = getGraphFiatCoinId(account.symbol);
        if (!coinId) {
            return;
        }

        const balanceSteps = appendCurrentBalance(
            buildBalanceSteps(graphData, account),
            account.formattedBalance,
        );

        if (balanceSteps.length > 0) {
            const existingSource = sourcesByCoinId.get(coinId) ?? {
                currentOnlyBalance: 0,
                stepSets: [],
            };
            existingSource.stepSets.push(balanceSteps);
            sourcesByCoinId.set(coinId, existingSource);
        } else if (!new BigNumber(account.formattedBalance).isZero()) {
            const existingSource = sourcesByCoinId.get(coinId) ?? {
                currentOnlyBalance: 0,
                stepSets: [],
            };
            existingSource.currentOnlyBalance += parseFloat(account.formattedBalance);
            sourcesByCoinId.set(coinId, existingSource);
        }
    });

    return sourcesByCoinId;
};

const mergeCoinSeries = (
    previous: Record<string, GraphDataPoint[]>,
    next: Record<string, GraphDataPoint[]>,
) => {
    const mergedCoinIds = Array.from(
        new Set([...Object.keys(previous), ...Object.keys(next)]),
    ).sort();

    return Object.fromEntries(
        mergedCoinIds.map(coinId => [
            coinId,
            mergeHistoricalGraphData({
                previousPoints: previous[coinId] ?? [],
                nextPoints: next[coinId] ?? [],
            }),
        ]),
    );
};

export const DashboardHistoricalFiatGraph = ({
    accounts,
    fallback,
    isGraphLoading,
}: DashboardHistoricalFiatGraphProps) => {
    const theme = useTheme();
    const { selectedRange } = useGraph();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();
    const [frozenNow, setFrozenNow] = useState(() => Date.now() / 1000);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const graphData = useSelector(selectGraphData);

    const eligibleAccounts = useMemo(
        () =>
            accounts.filter(
                account =>
                    account.visible &&
                    enabledNetworks.includes(account.symbol) &&
                    !!getGraphFiatCoinId(account.symbol) &&
                    isNetworkWithGraphFeature(account.symbol, account.backendType),
            ),
        [accounts, enabledNetworks],
    );
    const coinBalanceSources = useMemo(
        () =>
            buildCoinBalanceSources({
                accounts: eligibleAccounts,
                graphData,
            }),
        [eligibleAccounts, graphData],
    );
    const coinIds = useMemo(
        () => Array.from(coinBalanceSources.keys()).sort(),
        [coinBalanceSources],
    );
    const rangeKey = getRangeKey(selectedRange);
    const accountKeysKey = useMemo(
        () => accounts.map(account => account.key).join('|'),
        [accounts],
    );
    const {
        isLoading: isPriceHistoriesLoading,
        priceHistories,
        requiredResolution,
    } = usePriceHistories(coinIds, selectedRange);
    const historicalFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';

    const evictHistoricalResolutionFromMemory = useCallback(
        (resolution: GraphFiatResolution) => {
            if (coinIds.length === 0) {
                return;
            }

            dispatch(
                removeGraphFiatResolutionsFromMemory(
                    coinIds.map(coinId => ({
                        baseCurrencyCode: historicalFiatCurrencyCode,
                        coinId,
                        resolution,
                    })),
                ),
            );
        },
        [coinIds, dispatch, historicalFiatCurrencyCode],
    );

    useEffect(() => {
        setFrozenNow(Date.now() / 1000);
    }, [accountKeysKey, rangeKey]);

    const historicalRightEdge = useMemo(() => {
        const lastPriceTime = coinIds.reduce(
            (latest, coinId) => Math.max(latest, priceHistories[coinId]?.at(-1)?.time ?? 0),
            0,
        );

        return lastPriceTime > 0 ? lastPriceTime : frozenNow;
    }, [coinIds, frozenNow, priceHistories]);
    const historicalRangeStartTime = getRangeBounds(selectedRange, historicalRightEdge)?.startTime;

    const historicalCoinSeriesByCoinId = useMemo(() => {
        const coinSeriesByCoinId = new Map<string, GraphDataPoint[]>();

        coinBalanceSources.forEach((coinBalanceSource, coinId) => {
            const priceHistory = priceHistories[coinId] ?? [];
            const stepSets = [...coinBalanceSource.stepSets];
            const anchorTime = historicalRangeStartTime ?? priceHistory[0]?.time;

            if (coinBalanceSource.currentOnlyBalance > 0 && anchorTime !== undefined) {
                stepSets.push([
                    {
                        time: anchorTime,
                        balance: coinBalanceSource.currentOnlyBalance.toString(),
                    },
                ]);
            }

            const points = buildCoinHistoricalSeries({
                balanceSteps: aggregateBalanceStepSets(stepSets),
                priceHistory,
            });

            coinSeriesByCoinId.set(coinId, points);
        });

        return coinSeriesByCoinId;
    }, [coinBalanceSources, historicalRangeStartTime, priceHistories]);

    const historicalPoints = useMemo(
        () =>
            buildAlignedPortfolioSeriesFromCoinSeries({
                coinSeriesEntries: Array.from(historicalCoinSeriesByCoinId.values()),
                rangeLabel: selectedRange.label,
                startTime: historicalRangeStartTime,
            }),
        [historicalCoinSeriesByCoinId, historicalRangeStartTime, selectedRange.label],
    );
    const historicalCoinSeriesRecord = useMemo(
        () => Object.fromEntries(historicalCoinSeriesByCoinId),
        [historicalCoinSeriesByCoinId],
    );

    const allWindowSecs = useMemo(
        () => getAllWindowSecs(historicalPoints, historicalRightEdge),
        [historicalPoints, historicalRightEdge],
    );
    const historicalWindow =
        getRangeBounds(selectedRange, historicalRightEdge)?.window ?? allWindowSecs;
    const {
        displayedData: displayedHistoricalCoinSeriesByCoinId,
        displayedRangeLabel: displayedHistoricalRangeLabel,
        displayedWindow: displayedHistoricalWindow,
    } = useResolutionTransition({
        identityKey: accountKeysKey,
        requiredResolution,
        isDataLoading: isPriceHistoriesLoading,
        hasData: historicalPoints.length > 0,
        currentData: historicalCoinSeriesRecord,
        currentWindow: historicalWindow,
        currentRangeLabel: selectedRange.label,
        merge: mergeCoinSeries,
        evict: evictHistoricalResolutionFromMemory,
    });
    const [renderHistoricalWindow, setRenderHistoricalWindow] = useState(displayedHistoricalWindow);

    useEffect(() => {
        if (
            displayedHistoricalRangeLabel === 'all' ||
            displayedHistoricalWindow >= renderHistoricalWindow
        ) {
            setRenderHistoricalWindow(displayedHistoricalWindow);

            return;
        }

        const transitionTimeoutId = window.setTimeout(() => {
            setRenderHistoricalWindow(displayedHistoricalWindow);
        }, LIVELINE_WINDOW_TRANSITION_MS);

        return () => {
            window.clearTimeout(transitionTimeoutId);
        };
    }, [displayedHistoricalRangeLabel, displayedHistoricalWindow, renderHistoricalWindow]);

    const effectiveRenderHistoricalWindow =
        displayedHistoricalRangeLabel === 'all'
            ? displayedHistoricalWindow
            : Math.max(displayedHistoricalWindow, renderHistoricalWindow);

    const displayedHistoricalPoints = useMemo(() => {
        const displayedRangeStartTime =
            displayedHistoricalRangeLabel === 'all'
                ? undefined
                : historicalRightEdge - effectiveRenderHistoricalWindow;

        return buildAlignedPortfolioSeriesFromCoinSeries({
            coinSeriesEntries: Object.values(displayedHistoricalCoinSeriesByCoinId),
            rangeLabel: displayedHistoricalRangeLabel,
            startTime: displayedRangeStartTime,
        });
    }, [
        displayedHistoricalCoinSeriesByCoinId,
        displayedHistoricalRangeLabel,
        effectiveRenderHistoricalWindow,
        historicalRightEdge,
    ]);

    const activeWindow = displayedHistoricalWindow;
    const currentValue = displayedHistoricalPoints.at(-1)?.value ?? 0;
    const isLoading =
        displayedHistoricalPoints.length === 0 && (isPriceHistoriesLoading || isGraphLoading);
    const fiatFormatter = useMemo(
        () =>
            createGraphFiatFormatter({
                currencyCode: historicalFiatCurrencyCode,
                locale,
            }),
        [historicalFiatCurrencyCode, locale],
    );

    const formatTime = useCallback(
        (time: number) => formatGraphTime({ activeWindow, locale, time }),
        [activeWindow, locale],
    );

    const formatValue = useCallback(
        (value: number) => fiatFormatter.format(value),
        [fiatFormatter],
    );
    if (coinIds.length === 0) {
        return fallback;
    }

    if (!isLoading && displayedHistoricalPoints.length === 0) {
        return fallback;
    }

    return (
        <Box flex="1" height="100%" position={{ type: 'relative' }} minWidth={0}>
            <Liveline
                data={displayedHistoricalPoints}
                value={currentValue}
                theme={theme.mode}
                color={theme.contentBrand}
                grid={false}
                badge={false}
                pulse={false}
                momentum={false}
                exaggerate={false}
                fill
                scrub
                padding={HISTORICAL_GRAPH_PADDING}
                loading={isLoading}
                formatTime={formatTime}
                formatValue={formatValue}
                window={activeWindow}
                typography={HISTORICAL_GRAPH_TYPOGRAPHY}
            />
        </Box>
    );
};
