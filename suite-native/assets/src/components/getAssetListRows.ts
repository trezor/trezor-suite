import { type NetworkSymbol } from '@suite-common/wallet-config';

export type AssetListRow =
    | { type: 'asset'; symbol: NetworkSymbol; isFirst: boolean; isLast: boolean }
    | { type: 'loader'; isFirst: boolean; isLast: boolean };

type AssetListRowInput = { type: 'asset'; symbol: NetworkSymbol } | { type: 'loader' };

const DISCOVERY_LOADER_ROW_KEY = 'discovery-loader';

/**
 * Builds the flat, typed row model rendered by the home portfolio `FlashList`. Each network with
 * assets becomes an individual `asset` row and, while discovery is running, a trailing `loader`
 * row is appended. `isFirst`/`isLast` reproduce the rounded-card grouping the assets used to get
 * from their wrapping card.
 */
export const getAssetListRows = (
    symbols: NetworkSymbol[],
    { isLoading }: { isLoading: boolean },
): AssetListRow[] => {
    const rows: AssetListRowInput[] = [
        ...symbols.map((symbol): AssetListRowInput => ({ type: 'asset', symbol })),
        ...(isLoading ? [{ type: 'loader' } as const] : []),
    ];

    return rows.map((row, index) => ({
        ...row,
        isFirst: index === 0,
        isLast: index === rows.length - 1,
    }));
};

export const getAssetListRowKey = (row: AssetListRow): string =>
    row.type === 'asset' ? row.symbol : DISCOVERY_LOADER_ROW_KEY;
