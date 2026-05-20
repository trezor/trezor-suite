import { useCallback, useEffect, useMemo, useState } from 'react';

import { type HoverPoint, Liveline, type LivelineMarker } from '@seibei-iguchi/liveline';
import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';

import { removeGraphFiatResolutionsFromMemory } from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useGraph, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { type GraphRange } from 'src/types/wallet/graph';
import { accountGraphDataFilterFn } from 'src/utils/wallet/graph';

import {
    type BalanceEntry,
    type GraphDataPoint,
    balanceAtTime,
    buildBalanceSteps,
    createGraphFiatFormatter,
    formatGraphTime,
    getAllWindowSecs,
    getCoingeckoCoinId,
    getRangeBounds,
    getRangeKey,
    mergeHistoricalGraphData,
} from './graphViewUtils';
import { getCoinbaseProductId, useCoinbaseLivePrice } from './useCoinbaseLivePrice';
import { useLiveFiatExchangeRate } from './useLiveFiatExchangeRate';
import { type PricePoint, usePriceHistory } from './usePriceHistory';
import { useResolutionTransition } from './useResolutionTransition';

const selectGraphData = (state: AppState) => state.wallet.graph.data;

const buildHistoricalPortfolio = (
    balanceSteps: BalanceEntry[],
    priceHistory: PricePoint[],
): GraphDataPoint[] => {
    if (balanceSteps.length === 0 || priceHistory.length === 0) {
        return [];
    }

    const startTime = balanceSteps[0].time;
    const zeroAnchorTime = startTime - 30 * 24 * 3600;
    const points: GraphDataPoint[] = [
        { time: zeroAnchorTime, value: 0 },
        { time: startTime - 1, value: 0 },
    ];

    for (const pp of priceHistory) {
        if (pp.time < startTime) continue;

        points.push({
            time: pp.time,
            value: balanceAtTime(balanceSteps, pp.time) * pp.price,
        });
    }

    return points;
};

type LiveFiatGraphProps = {
    account: Account;
    isLive: boolean;
    isGraphLoading?: boolean;
    showMarkers?: boolean;
};

export const hasCoinbaseLiveSupport = (symbol: NetworkSymbol): boolean =>
    !!getCoinbaseProductId(symbol);

export const LiveFiatGraph = ({
    account,
    isLive,
    isGraphLoading = false,
    showMarkers = true,
}: LiveFiatGraphProps) => {
    const theme = useTheme();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();
    const { priceHistory: livePriceTicks, latestPrice } = useCoinbaseLivePrice(
        account.symbol,
        isLive,
    );

    const { selectedRange } = useGraph();
    const coingeckoId = getCoingeckoCoinId(account.symbol);
    const {
        isLoading: isPriceHistoryLoading,
        priceHistory,
        requiredResolution,
    } = usePriceHistory(coingeckoId, selectedRange);
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const historicalFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const {
        exchangeRate: liveExchangeRate,
        isLoading: isLiveExchangeRateLoading,
        liveCurrencyCode,
    } = useLiveFiatExchangeRate(isLive);

    const [frozenNow, setFrozenNow] = useState(() => Date.now() / 1000);
    const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);

    const balance = parseFloat(account.formattedBalance);

    const evictHistoricalResolutionFromMemory = useCallback(
        (resolution: 'day' | 'month' | 'max') => {
            if (!coingeckoId) {
                return;
            }

            console.warn('[graphFiat] evict account graph resolution from memory', {
                accountKey: account.key,
                baseCurrencyCode: historicalFiatCurrencyCode,
                coinId: coingeckoId,
                resolution,
            });

            dispatch(
                removeGraphFiatResolutionsFromMemory([
                    {
                        baseCurrencyCode: historicalFiatCurrencyCode,
                        coinId: coingeckoId,
                        resolution,
                    },
                ]),
            );
        },
        [account.key, coingeckoId, dispatch, historicalFiatCurrencyCode],
    );

    const rangeKey = getRangeKey(selectedRange);
    useEffect(() => {
        if (isLive) {
            return;
        }

        setFrozenNow(Date.now() / 1000);
    }, [account.key, isLive, rangeKey]);

    // Primary path: Blockbook/worker balance history.
    const graphData = useSelector(selectGraphData);
    const blockbookSteps = useMemo(
        () => buildBalanceSteps(graphData, account),
        [graphData, account],
    );
    const rawBalanceSteps = blockbookSteps;

    // Append current real balance so balanceAtTime returns the correct value
    // for recent timestamps (graph data may lag behind latest txs).
    const balanceSteps = useMemo(() => {
        if (rawBalanceSteps.length === 0) return rawBalanceSteps;

        const lastStep = rawBalanceSteps[rawBalanceSteps.length - 1];
        if (lastStep.balance === account.formattedBalance) return rawBalanceSteps;

        return [...rawBalanceSteps, { time: lastStep.time + 1, balance: account.formattedBalance }];
    }, [rawBalanceSteps, account.formattedBalance]);

    const historicalPoints = useMemo(
        () => buildHistoricalPortfolio(balanceSteps, priceHistory),
        [balanceSteps, priceHistory],
    );

    const networkDecimals = getNetwork(account.symbol).decimals;
    const historicalRightEdge = priceHistory.at(-1)?.time ?? frozenNow;
    const rangeBounds = getRangeBounds(selectedRange, historicalRightEdge);

    const allWindowSecs = useMemo(
        () => getAllWindowSecs(historicalPoints, historicalRightEdge),
        [historicalPoints, historicalRightEdge],
    );
    const historicalWindow = rangeBounds?.window ?? allWindowSecs;

    const mergePoints = useCallback(
        (previous: GraphDataPoint[], next: GraphDataPoint[]) =>
            mergeHistoricalGraphData({ previousPoints: previous, nextPoints: next }),
        [],
    );

    const handleIdentityChange = useCallback(() => {
        setHoverPoint(null);
    }, []);

    const {
        displayedData: displayedHistoricalPoints,
        displayedRangeLabel,
        isTransitioning,
        displayedWindow: displayedHistoricalWindow,
    } = useResolutionTransition({
        identityKey: account.key,
        isLive,
        requiredResolution,
        isDataLoading: isPriceHistoryLoading,
        hasData: historicalPoints.length > 0,
        currentData: historicalPoints,
        currentWindow: historicalWindow,
        currentRangeLabel: selectedRange.label,
        merge: mergePoints,
        evict: evictHistoricalResolutionFromMemory,
        onIdentityChange: handleIdentityChange,
    });
    const livePoints: GraphDataPoint[] = useMemo(() => {
        if (!isLive) return [];
        if (liveExchangeRate === null) return [];

        return livePriceTicks.map(tick => ({
            time: tick.time,
            value: balance * tick.price * liveExchangeRate,
        }));
    }, [isLive, balance, liveExchangeRate, livePriceTicks]);

    // Mode-dependent values
    const data = isLive ? livePoints : displayedHistoricalPoints;
    const activeWindow = isLive ? 60 : displayedHistoricalWindow;

    const markers = useMemo((): LivelineMarker[] => {
        if (!showMarkers || isLive || isTransitioning) return [];

        const accountData = graphData.find(d => accountGraphDataFilterFn(d, account));
        if (!accountData || priceHistory.length === 0) return [];

        const priceTimes = priceHistory.map(p => p.time);

        const snapToNearestPriceTick = (time: number) => {
            let lo = 0;
            let hi = priceTimes.length - 1;

            while (hi - lo > 1) {
                const mid = (lo + hi) >> 1;
                if (priceTimes[mid] <= time) lo = mid;
                else hi = mid;
            }

            const dLo = Math.abs(priceTimes[lo] - time);
            const dHi = Math.abs(priceTimes[hi] - time);

            return dLo <= dHi ? priceTimes[lo] : priceTimes[hi];
        };

        const rawEntries = accountData.data
            .filter(entry => entry.txs > 0)
            .map(entry => {
                const sent = parseFloat(entry.sent);
                const received = parseFloat(entry.received);

                return { time: snapToNearestPriceTick(entry.time), sent, received };
            })
            .sort((a, b) => a.time - b.time);

        return rawEntries.map(({ time, sent, received }) => {
            const net = received - sent;

            return {
                time,
                type: net >= 0 ? 'positive' : 'negative',
                label:
                    net >= 0
                        ? `+${received.toFixed(networkDecimals)} ${displaySymbol}`
                        : `-${sent.toFixed(networkDecimals)} ${displaySymbol}`,
            };
        });
    }, [
        account,
        displaySymbol,
        graphData,
        isLive,
        isTransitioning,
        networkDecimals,
        priceHistory,
        showMarkers,
    ]);

    const getGraphStyling = (rangeLabel: GraphRange['label']) => {
        switch (rangeLabel) {
            case 'day':
            case 'hour':
                return {
                    lineWidth: 2,
                    markerOutlineSize: 4,
                    markerSize: 4,
                };
            case 'week':
            case 'month':
                return {
                    lineWidth: 2,
                    markerOutlineSize: 3,
                    markerSize: 3,
                };
            case 'year':
            case 'all':
                return {
                    lineWidth: 2,
                    markerOutlineSize: 0,
                    markerSize: 2,
                };
            default:
                return {
                    lineWidth: 2,
                    markerOutlineSize: 4,
                    markerSize: 4,
                };
        }
    };

    const { markerSize, markerOutlineSize, lineWidth } = getGraphStyling(displayedRangeLabel);

    let currentValue = displayedHistoricalPoints.at(-1)?.value ?? 0;
    if (isLive) {
        currentValue =
            livePoints.at(-1)?.value ??
            (latestPrice !== null && liveExchangeRate !== null
                ? latestPrice * balance * liveExchangeRate
                : currentValue);
    }

    const isLoading = isLive
        ? isLiveExchangeRateLoading || livePoints.length < 2
        : displayedHistoricalPoints.length === 0 &&
          (isPriceHistoryLoading || (isGraphLoading && historicalPoints.length === 0));

    // Balance lookup for hover
    const allBalanceSteps = useMemo(
        () => [
            { time: 0, balance: '0' },
            ...balanceSteps,
            { time: historicalRightEdge, balance: account.formattedBalance },
        ],
        [account.formattedBalance, balanceSteps, historicalRightEdge],
    );

    const hoveredBalance = hoverPoint ? balanceAtTime(allBalanceSteps, hoverPoint.time) : null;
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

    const handleHover = useCallback((point: HoverPoint | null) => {
        setHoverPoint(point);
    }, []);

    const formatValue = useCallback(
        (v: number) => {
            const fiat = fiatFormatter.format(v);
            if (!isLive && hoveredBalance !== null) {
                return `${fiat}  ·  ${hoveredBalance.toFixed(getNetwork(account.symbol).decimals)} ${displaySymbol}`;
            }

            return fiat;
        },
        [account.symbol, displaySymbol, fiatFormatter, hoveredBalance, isLive],
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
                key={account.key}
                data={data}
                value={currentValue}
                theme={theme.mode}
                color={theme.contentBrand}
                grid={isLive}
                badge={isLive}
                momentum={isLive}
                fill
                pulse={isLive}
                exaggerate={isLive}
                scrub
                padding={{ top: 0, bottom: 30, left: 0 }}
                markerSize={markerSize}
                markerOutlineSize={markerOutlineSize}
                lineWidth={lineWidth}
                loading={isLoading}
                formatTime={formatTime}
                markers={markers}
                formatValue={formatValue}
                window={activeWindow}
                onHover={handleHover}
                typography={livelineTypography}
            />
        </Box>
    );
};
