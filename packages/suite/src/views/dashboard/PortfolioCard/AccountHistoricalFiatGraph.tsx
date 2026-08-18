import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { type HoverPoint, Liveline, type LivelineMarker } from '@seibei-iguchi/liveline';
import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { getGraphFiatCoinId } from '@suite-common/fiat-services';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type GraphFiatResolution } from '@suite-common/wallet-types';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box } from '@trezor/components';

import { removeGraphFiatResolutionsFromMemory } from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useGraph, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { accountGraphDataFilterFn } from 'src/utils/wallet/graph';

import {
    type GraphDataPoint,
    HISTORICAL_GRAPH_PADDING,
    HISTORICAL_GRAPH_TYPOGRAPHY,
    appendCurrentBalance,
    balanceAtTime,
    buildBalanceSteps,
    buildCoinHistoricalSeries,
    createGraphFiatFormatter,
    findClosestTime,
    formatGraphTime,
    getAllWindowSecs,
    getHistoricalGraphStyling,
    getRangeBounds,
    getRangeKey,
    mergeHistoricalGraphData,
} from './graphViewUtils';
import { usePriceHistory } from './usePriceHistory';
import { useResolutionTransition } from './useResolutionTransition';

const selectGraphData = (state: AppState) => state.wallet.graph.data;

const mergePoints = (previous: GraphDataPoint[], next: GraphDataPoint[]) =>
    mergeHistoricalGraphData({ previousPoints: previous, nextPoints: next });

type AccountHistoricalFiatGraphProps = {
    account: Account;
    fallback: ReactNode;
    isGraphLoading?: boolean;
    showMarkers?: boolean;
};

export const AccountHistoricalFiatGraph = ({
    account,
    fallback,
    isGraphLoading = false,
    showMarkers = true,
}: AccountHistoricalFiatGraphProps) => {
    const theme = useTheme();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();
    const { selectedRange } = useGraph();
    const coingeckoId = getGraphFiatCoinId(account.symbol);
    const {
        isLoading: isPriceHistoryLoading,
        priceHistory,
        requiredResolution,
    } = usePriceHistory(coingeckoId, selectedRange);
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const historicalFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';

    const [frozenNow, setFrozenNow] = useState(() => Date.now() / 1000);
    const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);

    const evictHistoricalResolutionFromMemory = useCallback(
        (resolution: GraphFiatResolution) => {
            if (!coingeckoId) {
                return;
            }

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
        [coingeckoId, dispatch, historicalFiatCurrencyCode],
    );

    const rangeKey = getRangeKey(selectedRange);
    useEffect(() => {
        setFrozenNow(Date.now() / 1000);
    }, [account.key, rangeKey]);

    const graphData = useSelector(selectGraphData);
    const balanceSteps = useMemo(
        () => appendCurrentBalance(buildBalanceSteps(graphData, account), account.formattedBalance),
        [account, graphData],
    );

    const historicalPoints = useMemo(
        () => buildCoinHistoricalSeries({ balanceSteps, priceHistory }),
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
    const markers = useMemo((): LivelineMarker[] => {
        if (!showMarkers || isTransitioning) return [];

        const accountData = graphData.find(d => accountGraphDataFilterFn(d, account));
        if (!accountData || priceHistory.length === 0) return [];

        const rawEntries = accountData.data
            .filter(entry => entry.txs > 0)
            .map(entry => {
                const sent = parseFloat(entry.sent);
                const received = parseFloat(entry.received);

                return {
                    time: findClosestTime(priceHistory, entry.time) ?? entry.time,
                    sent,
                    received,
                };
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
        isTransitioning,
        networkDecimals,
        priceHistory,
        showMarkers,
    ]);

    const { markerSize, markerOutlineSize, lineWidth } =
        getHistoricalGraphStyling(displayedRangeLabel);

    const currentValue = displayedHistoricalPoints.at(-1)?.value ?? 0;
    const isLoading =
        displayedHistoricalPoints.length === 0 &&
        (isPriceHistoryLoading || (isGraphLoading && historicalPoints.length === 0));

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
                currencyCode: historicalFiatCurrencyCode,
                locale,
            }),
        [historicalFiatCurrencyCode, locale],
    );

    const formatTime = useCallback(
        (time: number) =>
            formatGraphTime({ activeWindow: displayedHistoricalWindow, locale, time }),
        [displayedHistoricalWindow, locale],
    );

    const handleHover = useCallback((point: HoverPoint | null) => {
        setHoverPoint(point);
    }, []);

    const formatValue = useCallback(
        (v: number) => {
            const fiat = fiatFormatter.format(v);
            if (hoveredBalance !== null) {
                return `${fiat}  ·  ${hoveredBalance.toFixed(networkDecimals)} ${displaySymbol}`;
            }

            return fiat;
        },
        [displaySymbol, fiatFormatter, hoveredBalance, networkDecimals],
    );

    if (!coingeckoId) {
        return fallback;
    }

    if (!isLoading && displayedHistoricalPoints.length === 0) {
        return fallback;
    }

    return (
        <Box flex="1" height="100%" position={{ type: 'relative' }} minWidth={0}>
            <Liveline
                key={account.key}
                data={displayedHistoricalPoints}
                value={currentValue}
                theme={theme.mode}
                color={theme.contentBrand}
                grid={false}
                badge={false}
                momentum={false}
                fill
                pulse={false}
                exaggerate={false}
                scrub
                padding={HISTORICAL_GRAPH_PADDING}
                markerSize={markerSize}
                markerOutlineSize={markerOutlineSize}
                lineWidth={lineWidth}
                loading={isLoading}
                formatTime={formatTime}
                markers={markers}
                formatValue={formatValue}
                window={displayedHistoricalWindow}
                onHover={handleHover}
                typography={HISTORICAL_GRAPH_TYPOGRAPHY}
            />
        </Box>
    );
};
