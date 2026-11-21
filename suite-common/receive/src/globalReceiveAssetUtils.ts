import { normalizeForSearch } from '@suite-common/suite-utils';
import { type RankedTokenStructure } from '@suite-common/token-definitions';
import { type AssetId, type AssetKey, getAssetKey, toTokenAddress } from '@suite-common/tokens';
import {
    type Network,
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type ReceiveAssetBalance, type ReceiveAssetBalances } from './receiveAssetBalances';

export type GlobalReceiveAssetCatalog = {
    assetIds: readonly AssetId[];
    searchIndex: ReadonlyMap<AssetKey, readonly string[]>;
};

type BuildGlobalReceiveAssetCatalogParams = {
    networks: readonly Network[];
    definitions: RankedTokenStructure;
};

/** Identities and search data come from Receive's ranked catalogue, independently of trading. */
export const buildGlobalReceiveAssetCatalog = ({
    networks,
    definitions,
}: BuildGlobalReceiveAssetCatalogParams): GlobalReceiveAssetCatalog => {
    const assetIds: AssetId[] = [];
    const searchIndex = new Map<AssetKey, readonly string[]>();
    const addAsset = (assetId: AssetId, fields: string[]) => {
        const assetKey = getAssetKey(assetId);
        if (searchIndex.has(assetKey)) {
            return;
        }

        assetIds.push(assetId);
        searchIndex.set(assetKey, fields.map(normalizeForSearch));
    };

    for (const network of networks) {
        addAsset({ networkSymbol: network.symbol }, [
            getNetworkDisplaySymbolName(network.symbol),
            getNetworkDisplaySymbol(network.symbol),
            network.name,
            network.symbol,
        ]);
    }

    const networksByPlatform = new Map(networks.map(network => [network.coingeckoId, network]));
    // Deduplication retains the first entry in the published market-cap order.
    for (const token of definitions) {
        const network = networksByPlatform.get(token.assetPlatformId);
        if (!network) {
            continue;
        }

        addAsset(
            {
                networkSymbol: network.symbol,
                contractAddress: toTokenAddress(token.address),
            },
            [token.name, token.symbol, network.name, network.symbol, token.address],
        );
    }

    return { assetIds, searchIndex };
};

export type GlobalReceiveAssetListItem = {
    assetId: AssetId;
    balance: ReceiveAssetBalance | undefined;
};

export type GlobalReceiveAssetSections = {
    myAssets: GlobalReceiveAssetListItem[];
    otherAssets: GlobalReceiveAssetListItem[];
    hasMoreOtherAssets: boolean;
};

type GetGlobalReceiveAssetSectionsParams = {
    catalog: GlobalReceiveAssetCatalog;
    balances: ReceiveAssetBalances;
    assetKeysWithHistory?: ReadonlySet<AssetKey>;
    search: string;
    networkSymbols: NetworkSymbol[];
    otherAssetsLimit?: number;
};

const EMPTY_ASSET_KEYS_WITH_HISTORY: ReadonlySet<AssetKey> = new Set();
const ZERO_ASSET_BALANCE: ReceiveAssetBalance = {
    cryptoAmount: '0',
    fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
};

const compareHeldAssets = (
    balances: ReceiveAssetBalances,
    assetA: AssetId,
    assetB: AssetId,
): number => {
    const fiatAmountA = balances.get(getAssetKey(assetA))?.fiatAmount ?? null;
    const fiatAmountB = balances.get(getAssetKey(assetB))?.fiatAmount ?? null;
    if (fiatAmountA === null && fiatAmountB === null) {
        return 0;
    }

    if (fiatAmountA === null) {
        return 1;
    }

    if (fiatAmountB === null) {
        return -1;
    }

    return fiatAmountB.comparedTo(fiatAmountA) ?? 0;
};

export const getGlobalReceiveAssetSections = ({
    catalog,
    balances,
    assetKeysWithHistory = EMPTY_ASSET_KEYS_WITH_HISTORY,
    search,
    networkSymbols,
    otherAssetsLimit = Infinity,
}: GetGlobalReceiveAssetSectionsParams): GlobalReceiveAssetSections => {
    const query = normalizeForSearch(search);
    const heldAssets: AssetId[] = [];
    const assetsWithHistory: GlobalReceiveAssetListItem[] = [];
    const nativeAssets: GlobalReceiveAssetListItem[] = [];
    const tokenAssets: GlobalReceiveAssetListItem[] = [];
    let otherAssetsCount = 0;
    let hasMoreOtherAssets = false;

    for (const assetId of catalog.assetIds) {
        const { networkSymbol, contractAddress } = assetId;
        const assetKey = getAssetKey(assetId);
        if (networkSymbols.length && !networkSymbols.includes(networkSymbol)) {
            continue;
        }

        if (query && !catalog.searchIndex.get(assetKey)?.some(field => field.includes(query))) {
            continue;
        }

        if (balances.has(assetKey)) {
            heldAssets.push(assetId);
        } else if (assetKeysWithHistory.has(assetKey)) {
            assetsWithHistory.push({ assetId, balance: ZERO_ASSET_BALANCE });
        } else if (otherAssetsCount < otherAssetsLimit) {
            otherAssetsCount++;
            const items = contractAddress === undefined ? nativeAssets : tokenAssets;
            items.push({ assetId, balance: undefined });
        } else {
            hasMoreOtherAssets = true;
        }
    }

    const fundedAssets = heldAssets
        .toSorted((assetA, assetB) => compareHeldAssets(balances, assetA, assetB))
        .map(assetId => ({ assetId, balance: balances.get(getAssetKey(assetId)) }));

    return {
        myAssets: [...fundedAssets, ...assetsWithHistory],
        otherAssets: [...nativeAssets, ...tokenAssets],
        hasMoreOtherAssets,
    };
};
