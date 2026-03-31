import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { Liveline } from '@seibei-iguchi/liveline';
import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { selectBaseCurrency, selectEnabledNetworks } from '@suite-common/wallet-core';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { removeGraphFiatResolutionsFromMemory } from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useGraph, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { type GraphData } from 'src/types/wallet/graph';
import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';

import {
    aggregateBalanceStepSets,
    appendCurrentBalance,
    buildAlignedPortfolioSeriesFromCoinSeries,
    buildBalanceSteps,
    buildCoinHistoricalSeries,
    createGraphFiatFormatter,
    formatGraphTime,
    getAllWindowSecs,
    getCoingeckoCoinId,
    getRangeBounds,
    getRangeKey,
    mergeHistoricalGraphData,
    valueAtTime,
} from './graphViewUtils';
import type { BalanceEntry, GraphDataPoint } from './graphViewUtils';
import { getCoinbaseProductId, useCoinbaseLivePrices } from './useCoinbaseLivePrice';
import { useLiveFiatExchangeRate } from './useLiveFiatExchangeRate';
import { type PricePoint, usePriceHistories } from './usePriceHistory';
import { useResolutionTransition } from './useResolutionTransition';

type CoinBalanceSource = {
    currentOnlyBalance: number;
    stepSets: BalanceEntry[][];
};

type DashboardLiveFiatGraphProps = {
    accounts: Account[];
    isLive: boolean;
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
        const coinId = getCoingeckoCoinId(account.symbol);
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

export const DashboardLiveFiatGraph = ({ accounts, isLive }: DashboardLiveFiatGraphProps) => {
    const theme = useTheme();
    const { selectedRange } = useGraph();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();
    const deferredSelectedRange = useDeferredValue(selectedRange);
    const [frozenNow, setFrozenNow] = useState(() => Date.now() / 1000);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const graphData = useSelector(selectGraphData);

    const eligibleAccounts = useMemo(
        () =>
            accounts.filter(
                account =>
                    account.visible &&
                    enabledNetworks.includes(account.symbol) &&
                    !!getCoingeckoCoinId(account.symbol) &&
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
    const liveEligibleAccounts = useMemo(
        () => eligibleAccounts.filter(account => !!getCoinbaseProductId(account.symbol)),
        [eligibleAccounts],
    );
    const liveCoinBalanceSources = useMemo(
        () =>
            buildCoinBalanceSources({
                accounts: liveEligibleAccounts,
                graphData,
            }),
        [graphData, liveEligibleAccounts],
    );
    const liveSymbols = useMemo(
        () => Array.from(new Set(liveEligibleAccounts.map(account => account.symbol))).sort(),
        [liveEligibleAccounts],
    );
    const rangeKey = getRangeKey(deferredSelectedRange);
    const accountKeysKey = useMemo(
        () => accounts.map(account => account.key).join('|'),
        [accounts],
    );
    const {
        isLoading: isPriceHistoriesLoading,
        priceHistories,
        requiredResolution,
    } = usePriceHistories(coinIds, deferredSelectedRange);
    const { priceHistoriesBySymbol: livePriceHistoriesBySymbol } = useCoinbaseLivePrices(
        liveSymbols,
        isLive,
    );
    const historicalFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const {
        exchangeRate: liveExchangeRate,
        isLoading: isLiveExchangeRateLoading,
        liveCurrencyCode,
    } = useLiveFiatExchangeRate(isLive);
    const historicalCoinSeriesCacheRef = useRef(
        new Map<
            string,
            {
                points: GraphDataPoint[];
                signature: string;
            }
        >(),
    );

    const evictHistoricalResolutionFromMemory = useCallback(
        (resolution: 'day' | 'month' | 'max') => {
            if (coinIds.length === 0) {
                return;
            }

            console.warn('[graphFiat] evict dashboard graph resolution from memory', {
                baseCurrencyCode: historicalFiatCurrencyCode,
                coinIds,
                resolution,
            });

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
        if (isLive) {
            return;
        }

        setFrozenNow(Date.now() / 1000);
    }, [accountKeysKey, isLive, rangeKey]);

    const historicalRightEdge = useMemo(() => {
        const lastPriceTime = coinIds.reduce(
            (latest, coinId) => Math.max(latest, priceHistories[coinId]?.at(-1)?.time ?? 0),
            0,
        );

        return lastPriceTime > 0 ? lastPriceTime : frozenNow;
    }, [coinIds, frozenNow, priceHistories]);
    const historicalRangeStartTime = getRangeBounds(
        deferredSelectedRange,
        historicalRightEdge,
    )?.startTime;

    const historicalCoinSeriesByCoinId = useMemo(() => {
        const nextCoinSeriesByCoinId = new Map<string, GraphDataPoint[]>();
        const nextCoinIds = new Set(coinIds);

        historicalCoinSeriesCacheRef.current.forEach((_entry, coinId) => {
            if (!nextCoinIds.has(coinId)) {
                historicalCoinSeriesCacheRef.current.delete(coinId);
            }
        });

        coinBalanceSources.forEach((coinBalanceSource, coinId) => {
            const priceHistory = priceHistories[coinId] ?? [];
            const stepSets = [...coinBalanceSource.stepSets];
            const anchorTime = historicalRangeStartTime ?? priceHistory[0]?.time;
            const currentOnlyBalanceAnchorSignature =
                coinBalanceSource.currentOnlyBalance > 0 && anchorTime !== undefined
                    ? `${anchorTime}:${coinBalanceSource.currentOnlyBalance}`
                    : 'none';

            if (coinBalanceSource.currentOnlyBalance > 0 && anchorTime !== undefined) {
                stepSets.push([
                    {
                        time: anchorTime,
                        balance: coinBalanceSource.currentOnlyBalance.toString(),
                    },
                ]);
            }

            const stepSignature = stepSets
                .map(stepSet => {
                    const firstStep = stepSet[0];
                    const lastStep = stepSet.at(-1);

                    return `${stepSet.length}:${firstStep?.time ?? 'none'}:${lastStep?.time ?? 'none'}:${lastStep?.balance ?? 'none'}`;
                })
                .join('|');
            const lastPricePoint = priceHistory.at(-1);
            const signature = [
                currentOnlyBalanceAnchorSignature,
                stepSignature,
                priceHistory.length,
                lastPricePoint?.time ?? 'none',
                lastPricePoint?.price ?? 'none',
            ].join(':');
            const cachedSeries = historicalCoinSeriesCacheRef.current.get(coinId);

            if (cachedSeries?.signature === signature) {
                nextCoinSeriesByCoinId.set(coinId, cachedSeries.points);

                return;
            }

            const points = buildCoinHistoricalSeries({
                balanceSteps: aggregateBalanceStepSets(stepSets),
                priceHistory,
            });

            historicalCoinSeriesCacheRef.current.set(coinId, {
                points,
                signature,
            });
            nextCoinSeriesByCoinId.set(coinId, points);
        });

        return nextCoinSeriesByCoinId;
    }, [coinBalanceSources, coinIds, historicalRangeStartTime, priceHistories]);

    const historicalPoints = useMemo(
        () =>
            buildAlignedPortfolioSeriesFromCoinSeries({
                coinSeriesEntries: Array.from(historicalCoinSeriesByCoinId.values()),
                rangeLabel: deferredSelectedRange.label,
            }),
        [deferredSelectedRange.label, historicalCoinSeriesByCoinId],
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
        getRangeBounds(deferredSelectedRange, historicalRightEdge)?.window ?? allWindowSecs;
    const mergeCoinSeries = useCallback(
        (previous: Record<string, GraphDataPoint[]>, next: Record<string, GraphDataPoint[]>) => {
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
        },
        [],
    );

    const {
        displayedData: displayedHistoricalCoinSeriesByCoinId,
        displayedRangeLabel: displayedHistoricalRangeLabel,
        displayedWindow: displayedHistoricalWindow,
    } = useResolutionTransition({
        identityKey: accountKeysKey,
        isLive,
        requiredResolution,
        isDataLoading: isPriceHistoriesLoading,
        hasData: historicalPoints.length > 0,
        currentData: historicalCoinSeriesRecord,
        currentWindow: historicalWindow,
        currentRangeLabel: deferredSelectedRange.label,
        merge: mergeCoinSeries,
        evict: evictHistoricalResolutionFromMemory,
    });

    const displayedHistoricalPoints = useMemo(
        () =>
            buildAlignedPortfolioSeriesFromCoinSeries({
                coinSeriesEntries: Object.values(displayedHistoricalCoinSeriesByCoinId),
                rangeLabel: displayedHistoricalRangeLabel,
            }),
        [displayedHistoricalCoinSeriesByCoinId, displayedHistoricalRangeLabel],
    );

    const livePoints = useMemo(() => {
        if (!isLive) {
            return [];
        }
        if (liveExchangeRate === null) {
            return [];
        }

        const liveTimeline = Array.from(
            new Set(
                liveEligibleAccounts.flatMap(account =>
                    (livePriceHistoriesBySymbol[account.symbol] ?? [])
                        .map(point => point.time)
                        .filter(time => Number.isFinite(time)),
                ),
            ),
        ).sort((a, b) => a - b);
        const livePriceHistoriesByCoinId = new Map(
            liveEligibleAccounts
                .map(account => {
                    const coinId = getCoingeckoCoinId(account.symbol);

                    if (!coinId) {
                        return null;
                    }

                    return [coinId, livePriceHistoriesBySymbol[account.symbol] ?? []] as const;
                })
                .filter((entry): entry is readonly [string, PricePoint[]] => entry !== null),
        );
        const liveCoinSeriesEntries = Array.from(liveCoinBalanceSources.entries()).map(
            ([coinId, coinBalanceSource]) =>
                buildCoinHistoricalSeries({
                    balanceSteps: aggregateBalanceStepSets(coinBalanceSource.stepSets),
                    priceHistory: livePriceHistoriesByCoinId.get(coinId) ?? [],
                }),
        );
        const appendedPoints = liveTimeline.map(time => ({
            time,
            value:
                liveCoinSeriesEntries.reduce((sum, points) => sum + valueAtTime(points, time), 0) *
                liveExchangeRate,
        }));

        return appendedPoints;
    }, [
        isLive,
        liveCoinBalanceSources,
        liveEligibleAccounts,
        liveExchangeRate,
        livePriceHistoriesBySymbol,
    ]);

    const activeWindow = isLive ? 60 : displayedHistoricalWindow;
    const currentValue = (isLive ? livePoints : displayedHistoricalPoints).at(-1)?.value ?? 0;
    const isLoading = isLive
        ? isLiveExchangeRateLoading || (liveEligibleAccounts.length > 0 && livePoints.length < 2)
        : displayedHistoricalPoints.length === 0 &&
          (isPriceHistoriesLoading || eligibleAccounts.length > 0);
    const fiatFormatter = useMemo(
        () =>
            createGraphFiatFormatter({
                currencyCode: isLive ? liveCurrencyCode : historicalFiatCurrencyCode,
                locale,
            }),
        [historicalFiatCurrencyCode, isLive, liveCurrencyCode, locale],
    );

    const formatTime = useCallback(
        (time: number) => formatGraphTime({ activeWindow, locale, time }),
        [activeWindow, locale],
    );

    const formatValue = useCallback(
        (value: number) => fiatFormatter.format(value),
        [fiatFormatter],
    );
    const livelineTypography = useMemo(
        () => ({
            scrubFont: {
                size: typographyStylesBase['body-md'].fontSize,
                family: ['TT Satoshi'],
                weight: typographyStylesBase['body-md'].fontWeight,
            },
            gridLabelFont: {
                size: typographyStylesBase['body-xs'].fontSize,
                family: ['TT Satoshi'],
                weight: typographyStylesBase['body-xs'].fontWeight,
            },
        }),
        [],
    );

    return (
        <Box flex="1" height="100%" position={{ type: 'relative' }} minWidth={0}>
            <Liveline
                data={isLive ? livePoints : displayedHistoricalPoints}
                value={currentValue}
                theme={theme.mode}
                color={theme.contentBrand}
                grid={isLive}
                badge={isLive}
                pulse={isLive}
                momentum={isLive}
                exaggerate={isLive}
                fill
                scrub
                padding={{ top: 0, bottom: 30, left: 0 }}
                loading={isLoading}
                formatTime={formatTime}
                formatValue={formatValue}
                window={activeWindow}
                typography={livelineTypography}
            />
        </Box>
    );
};
