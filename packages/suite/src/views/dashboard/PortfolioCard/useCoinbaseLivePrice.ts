import { useEffect, useMemo, useRef, useState } from 'react';

import {
    COINBASE_LIVE_WINDOW_SECONDS,
    type CoinbaseLivePriceTick,
    createCoinbaseTickerStream,
    getCoinbaseProductId,
    smoothCoinbaseLivePriceTicks,
    trimCoinbaseLivePriceHistory,
} from '@suite-common/fiat-services';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export type LivePriceTick = CoinbaseLivePriceTick;
export { getCoinbaseProductId };

// Per-product module-level storage — survives component unmount/remount.
const productHistories = new Map<string, LivePriceTick[]>();
const productLatestPrices = new Map<string, number>();

type CoinbaseLivePrices = {
    latestPricesBySymbol: Partial<Record<NetworkSymbol, number>>;
    priceHistoriesBySymbol: Partial<Record<NetworkSymbol, LivePriceTick[]>>;
};

const getPriceHistoriesByProductId = (productIds: string[]) =>
    Object.fromEntries(
        productIds.map(productId => [
            productId,
            smoothCoinbaseLivePriceTicks(productHistories.get(productId) ?? []),
        ]),
    );

const getLatestPricesByProductId = (productIds: string[]) =>
    Object.fromEntries(
        productIds.map(productId => [productId, productLatestPrices.get(productId) ?? null]),
    );

export const useCoinbaseLivePrices = (
    symbols: NetworkSymbol[],
    enabled = true,
): CoinbaseLivePrices => {
    const normalizedSymbolsKey = useMemo(
        () => Array.from(new Set(symbols)).sort().join('|'),
        [symbols],
    );
    const normalizedSymbols = useMemo(
        () => (normalizedSymbolsKey ? (normalizedSymbolsKey.split('|') as NetworkSymbol[]) : []),
        [normalizedSymbolsKey],
    );
    const productIds = useMemo(
        () =>
            Array.from(
                new Set(
                    normalizedSymbols
                        .map(symbol => getCoinbaseProductId(symbol))
                        .filter((productId): productId is string => !!productId),
                ),
            ).sort(),
        [normalizedSymbols],
    );
    const productIdsKey = productIds.join('|');
    const [priceHistoriesByProductId, setPriceHistoriesByProductId] = useState<
        Record<string, LivePriceTick[]>
    >({});
    const [latestPricesByProductId, setLatestPricesByProductId] = useState<
        Record<string, number | null>
    >({});
    const streamRef = useRef<ReturnType<typeof createCoinbaseTickerStream> | null>(null);
    const previousProductIdsKeyRef = useRef<string | null>(null);
    const activeProductIdsRef = useRef<string[]>([]);

    useEffect(() => {
        let isActive = true;
        activeProductIdsRef.current = productIds;

        if (!enabled || productIds.length === 0) {
            streamRef.current?.close();
            streamRef.current = null;
            activeProductIdsRef.current.forEach(productId => {
                productHistories.delete(productId);
                productLatestPrices.delete(productId);
            });
            activeProductIdsRef.current = [];
            previousProductIdsKeyRef.current = null;
            setPriceHistoriesByProductId({});
            setLatestPricesByProductId({});

            return;
        }
        if (previousProductIdsKeyRef.current !== productIdsKey) {
            productIds.forEach(productId => {
                productHistories.set(productId, []);
                productLatestPrices.delete(productId);
            });
            previousProductIdsKeyRef.current = productIdsKey;
            setPriceHistoriesByProductId({});
            setLatestPricesByProductId({});
        } else {
            setPriceHistoriesByProductId(getPriceHistoriesByProductId(productIds));
            setLatestPricesByProductId(getLatestPricesByProductId(productIds));
        }

        const updateState = () => {
            setPriceHistoriesByProductId(getPriceHistoriesByProductId(productIds));
            setLatestPricesByProductId(getLatestPricesByProductId(productIds));
        };
        const trimExpiredPoints = (currentTime: number) => {
            const cutoffTime = currentTime - COINBASE_LIVE_WINDOW_SECONDS;
            let hasChanged = false;

            productIds.forEach(productId => {
                const previousHistory = productHistories.get(productId) ?? [];
                const trimmedHistory = trimCoinbaseLivePriceHistory(previousHistory, cutoffTime);

                if (trimmedHistory.length !== previousHistory.length) {
                    productHistories.set(productId, trimmedHistory);
                    hasChanged = true;
                }
            });

            if (hasChanged) {
                updateState();
            }
        };

        streamRef.current = createCoinbaseTickerStream({
            productIds,
            onTick: tick => {
                if (!isActive) {
                    return;
                }

                const previousHistory = productHistories.get(tick.productId) ?? [];
                const nextHistory = [...previousHistory, { time: tick.time, price: tick.price }];
                const trimmedHistory = trimCoinbaseLivePriceHistory(
                    nextHistory,
                    tick.time - COINBASE_LIVE_WINDOW_SECONDS,
                );

                productHistories.set(tick.productId, trimmedHistory);
                productLatestPrices.set(tick.productId, tick.price);
                updateState();
            },
        });
        const pruneInterval = setInterval(() => {
            if (!isActive) {
                return;
            }

            trimExpiredPoints(Date.now() / 1000);
        }, 1000);

        return () => {
            isActive = false;
            clearInterval(pruneInterval);
            streamRef.current?.close();
            streamRef.current = null;
            activeProductIdsRef.current.forEach(productId => {
                productHistories.delete(productId);
                productLatestPrices.delete(productId);
            });
            activeProductIdsRef.current = [];
        };
    }, [enabled, productIds, productIdsKey]);

    return useMemo(
        () => ({
            latestPricesBySymbol: Object.fromEntries(
                normalizedSymbols.map(symbol => [
                    symbol,
                    latestPricesByProductId[getCoinbaseProductId(symbol) ?? ''] ?? undefined,
                ]),
            ),
            priceHistoriesBySymbol: Object.fromEntries(
                normalizedSymbols.map(symbol => [
                    symbol,
                    priceHistoriesByProductId[getCoinbaseProductId(symbol) ?? ''] ?? [],
                ]),
            ),
        }),
        [latestPricesByProductId, normalizedSymbols, priceHistoriesByProductId],
    );
};

export const useCoinbaseLivePrice = (
    symbol: NetworkSymbol,
    enabled = true,
): {
    price: number | null;
    priceHistory: LivePriceTick[];
    latestPrice: number | null;
} => {
    const { latestPricesBySymbol, priceHistoriesBySymbol } = useCoinbaseLivePrices(
        [symbol],
        enabled,
    );
    const priceHistory = priceHistoriesBySymbol[symbol] ?? [];
    const latestPrice = latestPricesBySymbol[symbol] ?? null;

    return {
        price: latestPrice,
        priceHistory,
        latestPrice,
    };
};
