import { useMemo, useState } from 'react';

import { type CryptoId } from 'invity-api';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { type TradeableAssetBalances } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

type AssetSearchFields = {
    name: string;
    symbol: string;
    networkName: string;
    networkSymbol: string;
    contractAddress: string;
    cryptoId: CryptoId;
};

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
const EMPTY_ASSET_BALANCES: TradeableAssetBalances = new Map();

const getAssetSearchFields = (asset: TradeableAsset): AssetSearchFields => {
    const network = getNetworkByCoingeckoId(asset.networkId);

    return {
        name: normalizeForSearch(asset.name),
        symbol: normalizeForSearch(asset.symbol),
        cryptoId: asset.cryptoId,
        networkName: network ? normalizeForSearch(network.name) : '',
        networkSymbol: network ? normalizeForSearch(network.symbol) : '',
        contractAddress: asset.contractAddress ? normalizeForSearch(asset.contractAddress) : '',
    };
};

const doesAssetMatchQuery = (searchFields: AssetSearchFields, query: string): boolean =>
    searchFields.name.includes(query) ||
    searchFields.symbol.includes(query) ||
    searchFields.networkName.includes(query) ||
    searchFields.networkSymbol.includes(query) ||
    searchFields.contractAddress.includes(query);

const getAssetWeight = (searchFields: AssetSearchFields, query: string): number => {
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

export const useTradeableAssetsFilteredData = ({
    assets,
    assetBalances = EMPTY_ASSET_BALANCES,
    preferredCurrencyUsdThreshold = null,
}: {
    assets: TradeableAsset[];
    assetBalances?: TradeableAssetBalances;
    preferredCurrencyUsdThreshold?: BaseCurrencyAmount | null;
}) => {
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);
    const [filterValue, setFilterValue] = useState('');

    const searchFieldsByAsset = useMemo(
        () => new Map(assets.map(asset => [asset, getAssetSearchFields(asset)])),
        [assets],
    );

    const orderedAssets = useMemo(() => {
        const featuredAssets = new Array<TradeableAsset | undefined>(
            FEATURED_ASSET_CRYPTO_IDS.length,
        );
        const ownedAssets: TradeableAsset[] = [];
        const remainingAssets: TradeableAsset[] = [];

        assets.forEach(asset => {
            const featuredRank = FEATURED_ASSET_RANKS.get(asset.cryptoId);
            if (featuredRank !== undefined) {
                featuredAssets[featuredRank] = asset;

                return;
            }

            const fiatAmount = assetBalances.get(asset.cryptoId)?.fiatAmount;
            if (
                fiatAmount &&
                preferredCurrencyUsdThreshold &&
                fiatAmount.gt(preferredCurrencyUsdThreshold)
            ) {
                ownedAssets.push(asset);

                return;
            }

            remainingAssets.push(asset);
        });

        ownedAssets.sort((assetA, assetB) => {
            const fiatAmountA = assetBalances.get(assetA.cryptoId)?.fiatAmount;
            const fiatAmountB = assetBalances.get(assetB.cryptoId)?.fiatAmount;

            return fiatAmountB?.comparedTo(fiatAmountA ?? 0) ?? 0;
        });

        return [
            ...featuredAssets.filter((asset): asset is TradeableAsset => asset !== undefined),
            ...ownedAssets,
            ...remainingAssets,
        ];
    }, [assets, assetBalances, preferredCurrencyUsdThreshold]);

    const assetsFilteredByNetwork = useMemo(() => {
        if (!filterSymbol) {
            return orderedAssets;
        }

        return orderedAssets.filter(
            asset =>
                filterSymbol === cryptoIdToNetworkSymbol(searchFieldsByAsset.get(asset)?.cryptoId),
        );
    }, [filterSymbol, orderedAssets, searchFieldsByAsset]);

    const filteredData = useMemo(() => {
        const query = normalizeForSearch(filterValue);
        if (!query) {
            return assetsFilteredByNetwork;
        }

        const matchingAssets: TradeableAsset[] = [];
        const weightByAsset = new Map<CryptoId, number>();

        assetsFilteredByNetwork.forEach(asset => {
            const searchFields = searchFieldsByAsset.get(asset);
            if (searchFields && doesAssetMatchQuery(searchFields, query)) {
                matchingAssets.push(asset);
                weightByAsset.set(asset.cryptoId, getAssetWeight(searchFields, query));
            }
        });

        return matchingAssets.sort((a, b) => {
            const weightA = weightByAsset.get(a.cryptoId) ?? 0;
            const weightB = weightByAsset.get(b.cryptoId) ?? 0;
            if (weightA !== weightB) {
                return weightA - weightB;
            }

            return a.name.localeCompare(b.name);
        });
    }, [assetsFilteredByNetwork, searchFieldsByAsset, filterValue]);

    const filterValueWithNetwork = `Network:${filterSymbol ? filterSymbol : 'all'};Search:${filterValue}`;

    return {
        filterSymbol,
        setFilterSymbol,
        setFilterValue,
        filteredData,
        filterValue: filterValueWithNetwork,
    };
};
