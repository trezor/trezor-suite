import {
    type GraphFiatResolution,
    type GraphFiatResolutionEntry,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { getGraphFiatEntryKey } from 'src/support/wallet/graphFiatUtils';

export const loadGraphFiatEntriesFromStorage = async ({
    baseCurrencyCode,
    coinIds,
    resolution,
}: {
    baseCurrencyCode: BaseCurrencyCode;
    coinIds: string[];
    resolution: GraphFiatResolution;
}): Promise<{ key: string; value: GraphFiatResolutionEntry }[]> => {
    const { db } = await import('src/storage');

    if (!db.isAccessible() || coinIds.length === 0) {
        return [];
    }

    const entries = await Promise.all(
        coinIds.map(async coinId => {
            const key = getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution });
            const value = await db.getItemByPK('graphFiatRates', key);

            if (!value) {
                return null;
            }

            return { key, value };
        }),
    );

    return entries.filter(
        (entry): entry is { key: string; value: GraphFiatResolutionEntry } => entry !== null,
    );
};
