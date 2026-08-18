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

export const getRequiredGraphFiatResolution = (selectedRange: GraphRange): GraphFiatResolution => {
    switch (selectedRange.label) {
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
    priceHistory: GraphFiatPoint[];
    requiredResolution: GraphFiatResolution;
} => {
    const dispatch = useDispatch();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const requiredResolution = getRequiredGraphFiatResolution(selectedRange);
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

        dispatch(
            ensureGraphFiatRates({
                baseCurrencyCode: graphFiatCurrencyCode,
                coinIds: [coingeckoId],
                resolution: requiredResolution,
            }),
        );
    }, [coingeckoId, dispatch, graphFiatCurrencyCode, requiredResolution, selectedRange.label]);

    return {
        isLoading:
            !!coingeckoId &&
            (resolutionEntry?.points.length ?? 0) === 0 &&
            resolutionEntry?.error === null,
        priceHistory: resolutionEntry?.points ?? [],
        requiredResolution,
    };
};

export const usePriceHistories = (
    coingeckoIds: string[],
    selectedRange: GraphRange,
): {
    isLoading: boolean;
    priceHistories: Record<string, GraphFiatPoint[]>;
    requiredResolution: GraphFiatResolution;
} => {
    const dispatch = useDispatch();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const requiredResolution = getRequiredGraphFiatResolution(selectedRange);
    const normalizedCoinIdsKey = useMemo(
        () => Array.from(new Set(coingeckoIds)).sort().join('|'),
        [coingeckoIds],
    );
    const normalizedCoinIds = useMemo(
        () => (normalizedCoinIdsKey ? normalizedCoinIdsKey.split('|') : []),
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
        requiredResolution,
        selectedRange.label,
    ]);

    return {
        isLoading: normalizedCoinIds.length > 0 && !isRequiredResolutionReady,
        priceHistories: pointsByCoinId,
        requiredResolution,
    };
};
