import { type GraphFiatCoinEntry, type GraphFiatResolution } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    getGraphFiatEntryKey,
    keepOnlyGraphFiatResolution,
} from 'src/support/wallet/graphFiatUtils';

export const loadGraphFiatEntriesFromStorage = async ({
    baseCurrencyCode,
    coinIds,
    resolution,
}: {
    baseCurrencyCode: BaseCurrencyCode;
    coinIds: string[];
    resolution: GraphFiatResolution;
}): Promise<{ key: string; value: GraphFiatCoinEntry }[]> => {
    const { db } = await import('src/storage');

    if (!db.isAccessible() || coinIds.length === 0) {
        console.warn('[graphFiat] skip indexeddb hydration', {
            baseCurrencyCode,
            coinIds,
            dbAccessible: db.isAccessible(),
        });

        return [];
    }

    console.warn('[graphFiat] read graph fiat entries from indexeddb', {
        baseCurrencyCode,
        coinIds,
    });

    const entries = await Promise.all(
        coinIds.map(async coinId => {
            const key = getGraphFiatEntryKey({ baseCurrencyCode, coinId });
            const value = await db.getItemByPK('graphFiatRates', key);

            if (!value) {
                console.warn('[graphFiat] missing indexeddb graph fiat entry', {
                    baseCurrencyCode,
                    coinId,
                    key,
                });

                return null;
            }

            console.warn('[graphFiat] loaded graph fiat entry from indexeddb', {
                baseCurrencyCode,
                coinId,
                dayPoints: value.resolutions.day.points.length,
                maxPoints: value.resolutions.max.points.length,
                monthPoints: value.resolutions.month.points.length,
                resolution,
            });

            return {
                key,
                value: keepOnlyGraphFiatResolution({
                    coinEntry: value,
                    resolution,
                }),
            };
        }),
    );

    return entries.filter(
        (entry): entry is { key: string; value: GraphFiatCoinEntry } => entry !== null,
    );
};
