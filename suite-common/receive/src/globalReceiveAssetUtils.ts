import { type AssetId, createAssetId, parseAssetId } from '@suite-common/asset-types';
import { normalizeForSearch } from '@suite-common/suite-utils';
import { type RankedTokenStructure } from '@suite-common/token-definitions';
import { toTokenAddress } from '@suite-common/tokens';
import {
    type Network,
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { type AssetBalance, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type ReceiveAssetBalances } from './receiveAssetBalances';

export type GlobalReceiveAssetCatalog = {
    assetIds: readonly AssetId[];
    searchIndex: ReadonlyMap<AssetId, readonly string[]>;
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
    const searchIndex = new Map<AssetId, readonly string[]>();
    const addAsset = (assetId: AssetId, fields: string[]) => {
        if (searchIndex.has(assetId)) {
            return;
        }

        assetIds.push(assetId);
        searchIndex.set(assetId, fields.map(normalizeForSearch));
    };

    for (const network of networks) {
        addAsset(createAssetId({ networkSymbol: network.symbol }), [
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
            createAssetId({
                networkSymbol: network.symbol,
                contractAddress: toTokenAddress(token.address),
            }),
            [token.name, token.symbol, network.name, network.symbol, token.address],
        );
    }

    return { assetIds, searchIndex };
};

export type GlobalReceiveAssetListItem = {
    assetId: AssetId;
    balance: AssetBalance | undefined;
};

export type GlobalReceiveAssetSections = {
    myAssets: GlobalReceiveAssetListItem[];
    otherAssets: GlobalReceiveAssetListItem[];
    hasMoreOtherAssets: boolean;
};

type GetGlobalReceiveAssetSectionsParams = {
    catalog: GlobalReceiveAssetCatalog;
    balances: ReceiveAssetBalances;
    assetIdsWithHistory?: ReadonlySet<AssetId>;
    search: string;
    networkSymbols: NetworkSymbol[];
    otherAssetsLimit?: number;
};

const EMPTY_ASSET_IDS_WITH_HISTORY: ReadonlySet<AssetId> = new Set();
const ZERO_ASSET_BALANCE: AssetBalance = {
    cryptoAmount: '0',
    fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
};

const compareHeldAssets = (
    balances: ReceiveAssetBalances,
    assetA: AssetId,
    assetB: AssetId,
): number => {
    const fiatAmountA = balances.get(assetA)?.fiatAmount ?? null;
    const fiatAmountB = balances.get(assetB)?.fiatAmount ?? null;
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
    assetIdsWithHistory = EMPTY_ASSET_IDS_WITH_HISTORY,
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
        const { networkSymbol, contractAddress } = parseAssetId(assetId);
        if (networkSymbols.length && !networkSymbols.includes(networkSymbol)) {
            continue;
        }

        if (query && !catalog.searchIndex.get(assetId)?.some(field => field.includes(query))) {
            continue;
        }

        if (balances.has(assetId)) {
            heldAssets.push(assetId);
        } else if (assetIdsWithHistory.has(assetId)) {
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
        .map(assetId => ({ assetId, balance: balances.get(assetId) }));

    return {
        myAssets: [...fundedAssets, ...assetsWithHistory],
        otherAssets: [...nativeAssets, ...tokenAssets],
        hasMoreOtherAssets,
    };
};
