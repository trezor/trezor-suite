import { useEffect, useMemo } from 'react';

import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type GraphFiatPoint, type GraphFiatResolution } from '@suite-common/wallet-types';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    ensureGraphFiatRates,
    selectGraphFiatRequiredResolutionReady,
    selectGraphFiatResolutionEntry,
    selectGraphFiatResolutionSeriesByCoinIds,
} from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type GraphRange } from 'src/types/wallet/graph';

export type PricePoint = GraphFiatPoint;

const getRequiredGraphFiatResolution = (selectedRange: GraphRange): GraphFiatResolution => {
    switch (selectedRange.label) {
        case 'hour':
        case 'day':
            return 'day';
        case 'week':
        case 'month':
            return 'month';
        case 'year':
        case 'all':
            return 'max';
        default:
            return 'max';
    }
};

export const usePriceHistory = (
    coingeckoId: string | undefined,
    selectedRange: GraphRange,
): {
    isLoading: boolean;
    priceHistory: PricePoint[];
    requiredResolution: GraphFiatResolution;
} => {
    const dispatch = useDispatch();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const requiredResolution = useMemo(
        () => getRequiredGraphFiatResolution(selectedRange),
        [selectedRange],
    );
    const coinIds = useMemo(() => (coingeckoId ? [coingeckoId] : []), [coingeckoId]);
    const pointsByCoinId = useSelector(state =>
        selectGraphFiatResolutionSeriesByCoinIds(
            state,
            coinIds,
            graphFiatCurrencyCode,
            requiredResolution,
        ),
    );
    const resolutionEntry = useSelector(state =>
        coingeckoId
            ? selectGraphFiatResolutionEntry(
                  state,
                  coingeckoId,
                  graphFiatCurrencyCode,
                  requiredResolution,
              )
            : null,
    );

    useEffect(() => {
        if (!coingeckoId) return;

        console.warn('[graphFiat] account view requires resolution', {
            baseCurrencyCode: graphFiatCurrencyCode,
            coinId: coingeckoId,
            range: selectedRange.label,
            requiredResolution,
        });

        dispatch(
            ensureGraphFiatRates({
                baseCurrencyCode: graphFiatCurrencyCode,
                coinIds,
                resolution: requiredResolution,
            }),
        );
    }, [
        coinIds,
        coingeckoId,
        dispatch,
        graphFiatCurrencyCode,
        requiredResolution,
        selectedRange.label,
    ]);

    return {
        isLoading:
            !!coingeckoId &&
            !!resolutionEntry &&
            resolutionEntry.points.length === 0 &&
            resolutionEntry.error === null,
        priceHistory: coingeckoId ? (pointsByCoinId[coingeckoId] ?? []) : [],
        requiredResolution,
    };
};

export const usePriceHistories = (
    coingeckoIds: string[],
    selectedRange: GraphRange,
): {
    isLoading: boolean;
    priceHistories: Record<string, PricePoint[]>;
    requiredResolution: GraphFiatResolution;
} => {
    const dispatch = useDispatch();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const requiredResolution = useMemo(
        () => getRequiredGraphFiatResolution(selectedRange),
        [selectedRange],
    );
    const normalizedCoinIdsKey = useMemo(
        () => Array.from(new Set(coingeckoIds)).sort().join('|'),
        [coingeckoIds],
    );
    const normalizedCoinIds = useMemo(
        () => (normalizedCoinIdsKey ? (normalizedCoinIdsKey.split('|') as string[]) : []),
        [normalizedCoinIdsKey],
    );
    const pointsByCoinId = useSelector(state =>
        selectGraphFiatResolutionSeriesByCoinIds(
            state,
            normalizedCoinIds,
            graphFiatCurrencyCode,
            requiredResolution,
        ),
    );
    const isRequiredResolutionReady = useSelector(state =>
        selectGraphFiatRequiredResolutionReady(
            state,
            normalizedCoinIds,
            graphFiatCurrencyCode,
            requiredResolution,
        ),
    );

    useEffect(() => {
        if (normalizedCoinIds.length === 0) {
            return;
        }

        console.warn('[graphFiat] dashboard view requires resolution', {
            baseCurrencyCode: graphFiatCurrencyCode,
            coinIds: normalizedCoinIds,
            range: selectedRange.label,
            requiredResolution,
        });

        dispatch(
            ensureGraphFiatRates({
                baseCurrencyCode: graphFiatCurrencyCode,
                coinIds: normalizedCoinIds,
                resolution: requiredResolution,
            }),
        );
    }, [
        dispatch,
        graphFiatCurrencyCode,
        normalizedCoinIds,
        normalizedCoinIdsKey,
        requiredResolution,
        selectedRange.label,
    ]);

    return {
        isLoading: normalizedCoinIds.length > 0 && !isRequiredResolutionReady,
        priceHistories: pointsByCoinId,
        requiredResolution,
    };
};
