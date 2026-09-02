import { type CryptoId } from 'invity-api';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

import { type TradeableAssetBalances } from './tradeableAssetBalanceUtils';

const FEATURED_ASSET_CRYPTO_IDS = [
    'bitcoin',
    'ethereum',
    'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7',
    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'solana',
] as CryptoId[];

const FEATURED_ASSET_RANKS = new Map(
    FEATURED_ASSET_CRYPTO_IDS.map((cryptoId, index) => [cryptoId, index]),
);

export type TradeableAssetSearchFields = {
    name: string;
    symbol: string;
    networkName: string;
    networkSymbol: string;
    contractAddress: string;
};

export type TradeableAssetSearchEntry = TradeableAssetSearchFields & { sortName: string };

export type TradeableAssetSearchIndex<TAsset> = ReadonlyMap<TAsset, TradeableAssetSearchEntry>;

/**
 * Featured assets first in their fixed order, then owned assets worth more than the threshold
 * ordered by fiat value, then everything else in the order it came in.
 */
export const orderTradeableAssetsByOwnership = <TAsset>({
    assets,
    balances,
    threshold,
    getAssetCryptoId,
}: {
    assets: readonly TAsset[];
    balances: TradeableAssetBalances;
    threshold: BaseCurrencyAmount | null;
    getAssetCryptoId: (asset: TAsset) => CryptoId;
}): TAsset[] => {
    const featuredAssets = new Array<TAsset | undefined>(FEATURED_ASSET_CRYPTO_IDS.length);
    const ownedAssets: TAsset[] = [];
    const remainingAssets: TAsset[] = [];

    assets.forEach(asset => {
        const cryptoId = getAssetCryptoId(asset);
        const featuredRank = FEATURED_ASSET_RANKS.get(cryptoId);

        if (featuredRank !== undefined) {
            featuredAssets[featuredRank] = asset;

            return;
        }

        const fiatAmount = balances.get(cryptoId)?.fiatAmount;

        if (fiatAmount && threshold && fiatAmount.gt(threshold)) {
            ownedAssets.push(asset);

            return;
        }

        remainingAssets.push(asset);
    });

    ownedAssets.sort((assetA, assetB) => {
        const fiatAmountA = balances.get(getAssetCryptoId(assetA))?.fiatAmount;
        const fiatAmountB = balances.get(getAssetCryptoId(assetB))?.fiatAmount;

        return fiatAmountB?.comparedTo(fiatAmountA ?? 0) ?? 0;
    });

    return [
        ...featuredAssets.filter((asset): asset is TAsset => asset !== undefined),
        ...ownedAssets,
        ...remainingAssets,
    ];
};

export const buildTradeableAssetSearchIndex = <TAsset extends object>({
    assets,
    getSearchFields,
}: {
    assets: readonly TAsset[];
    getSearchFields: (asset: TAsset) => TradeableAssetSearchFields;
}): TradeableAssetSearchIndex<TAsset> =>
    new Map(
        assets.map(asset => {
            const fields = getSearchFields(asset);

            return [
                asset,
                {
                    name: normalizeForSearch(fields.name),
                    symbol: normalizeForSearch(fields.symbol),
                    networkName: normalizeForSearch(fields.networkName),
                    networkSymbol: normalizeForSearch(fields.networkSymbol),
                    contractAddress: normalizeForSearch(fields.contractAddress),
                    sortName: fields.name,
                },
            ];
        }),
    );

const doesAssetMatchQuery = (searchFields: TradeableAssetSearchFields, query: string): boolean =>
    searchFields.name.includes(query) ||
    searchFields.symbol.includes(query) ||
    searchFields.networkName.includes(query) ||
    searchFields.networkSymbol.includes(query) ||
    searchFields.contractAddress.includes(query);

const getAssetWeight = (searchFields: TradeableAssetSearchFields, query: string): number => {
    const { name, symbol, networkName, networkSymbol, contractAddress } = searchFields;

    if (name === query) {
        return 0;
    }
    if (symbol === query) {
        return 1;
    }
    if (name.startsWith(query)) {
        return 2;
    }
    if (symbol.startsWith(query)) {
        return 3;
    }
    if (name.includes(query)) {
        return 4;
    }
    if (symbol.includes(query)) {
        return 5;
    }
    if (networkName === query) {
        return 6;
    }
    if (networkSymbol === query) {
        return 7;
    }
    if (networkName.startsWith(query)) {
        return 8;
    }
    if (networkSymbol.startsWith(query)) {
        return 9;
    }
    if (networkName.includes(query)) {
        return 10;
    }
    if (networkSymbol.includes(query)) {
        return 11;
    }
    if (contractAddress.startsWith(query)) {
        return 12;
    }

    return 13;
};

/**
 * Keeps only assets matching the search, ranked by how well they match — an exact name hit wins
 * over a symbol hit, an asset hit over a network hit, and a contract address hit comes last.
 */
export const filterTradeableAssetsBySearch = <TAsset extends object>({
    assets,
    searchIndex,
    search,
}: {
    assets: readonly TAsset[];
    searchIndex: TradeableAssetSearchIndex<TAsset>;
    search: string;
}): TAsset[] => {
    const query = normalizeForSearch(search);

    if (!query) {
        return [...assets];
    }

    const matchingAssets: TAsset[] = [];
    const weightByAsset = new Map<TAsset, number>();

    assets.forEach(asset => {
        const searchFields = searchIndex.get(asset);

        if (searchFields && doesAssetMatchQuery(searchFields, query)) {
            matchingAssets.push(asset);
            weightByAsset.set(asset, getAssetWeight(searchFields, query));
        }
    });

    return matchingAssets.sort((assetA, assetB) => {
        const weightA = weightByAsset.get(assetA) ?? 0;
        const weightB = weightByAsset.get(assetB) ?? 0;

        if (weightA !== weightB) {
            return weightA - weightB;
        }

        return (searchIndex.get(assetA)?.sortName ?? '').localeCompare(
            searchIndex.get(assetB)?.sortName ?? '',
        );
    });
};
