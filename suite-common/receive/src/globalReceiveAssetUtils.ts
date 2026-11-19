import { normalizeForSearch } from '@suite-common/suite-utils';
import {
    type TokenMetadata,
    type TokenMetadataByNetwork,
    type TokenMetadataSource,
} from '@suite-common/token';
import { type RankedTokenStructure } from '@suite-common/token-definitions';
import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import {
    type TradeableAssetBalance,
    type TradeableAssetBalances,
    type TradeableAssetSearchIndex,
    type TradingAssetOption,
    buildTradeableAssetSearchIndex,
    createAssetNativeTokenOption,
    createAssetTokenOption,
    getTradingAssetSearchFields,
} from '@suite-common/trading';
import {
    type Network,
    type NetworkSymbol,
    getMainnets,
    toNetworkSymbolNonTestnet,
} from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

type BuildGlobalReceiveAssetOptionsParams = {
    networks: readonly Network[];
    definitions: RankedTokenStructure;
};

export const buildGlobalReceiveAssetOptions = ({
    networks,
    definitions,
}: BuildGlobalReceiveAssetOptionsParams): TradingAssetOption[] => {
    const assets: TradingAssetOption[] = networks.map(network =>
        createAssetNativeTokenOption(toNetworkSymbolNonTestnet(network.symbol)),
    );
    const networksByPlatform = new Map(networks.map(network => [network.coingeckoId, network]));
    const includedIds = new Set(assets.map(asset => asset.id));

    // Filtering keeps the published market-cap order; normalized duplicate IDs keep their first entry.
    definitions.forEach(token => {
        const network = networksByPlatform.get(token.assetPlatformId);
        if (!network) {
            return;
        }

        const asset = createAssetTokenOption(network.symbol, token.address);
        if (!includedIds.has(asset.id)) {
            assets.push(asset);
            includedIds.add(asset.id);
        }
    });

    return assets;
};

type BuildGlobalReceiveAssetOptionParams = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
};

export const buildGlobalReceiveAssetOption = ({
    symbol,
    contractAddress,
}: BuildGlobalReceiveAssetOptionParams): TradingAssetOption =>
    contractAddress === undefined
        ? createAssetNativeTokenOption(toNetworkSymbolNonTestnet(symbol))
        : createAssetTokenOption(symbol, contractAddress);

export type GlobalReceiveAssetListItem = {
    asset: TradingAssetOption;
    balance: TradeableAssetBalance | undefined;
};

export type GlobalReceiveAssetSections = {
    myAssets: GlobalReceiveAssetListItem[];
    otherAssets: GlobalReceiveAssetListItem[];
    hasMoreOtherAssets: boolean;
};

export const getGlobalReceiveAssetDescriptionValues = (
    asset: TradingAssetOption,
): { networkName?: string } => (asset.isNativeToken ? {} : { networkName: asset.networkName });

type GetGlobalReceiveAssetSectionsParams = {
    assets: readonly TradingAssetOption[];
    balances: TradeableAssetBalances;
    assetIdsWithHistory?: ReadonlySet<string>;
    search: string;
    searchIndex: TradeableAssetSearchIndex<TradingAssetOption>;
    networkSymbols: NetworkSymbol[];
    otherAssetsLimit?: number;
};

const EMPTY_ASSET_IDS_WITH_HISTORY: ReadonlySet<string> = new Set();
const ZERO_ASSET_BALANCE: TradeableAssetBalance = {
    cryptoAmount: '0',
    fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
};

export const rankedTokenDefinitionsToTokenMetadataSources = (
    definitions: RankedTokenStructure,
): TokenMetadataSource[] => {
    const networkSymbolsByPlatform = new Map(
        getMainnets().map(network => [network.coingeckoId, network.symbol]),
    );
    const tokensByNetwork = new Map<NetworkSymbol, TokenMetadata[]>();

    for (const token of definitions) {
        const networkSymbol = networkSymbolsByPlatform.get(token.assetPlatformId);
        if (!networkSymbol) continue;

        const tokens = tokensByNetwork.get(networkSymbol) ?? [];
        tokens.push({
            contract: toTokenAddress(token.address),
            name: token.name,
            symbol: token.symbol.toUpperCase(),
            isRecognized: true,
        });
        tokensByNetwork.set(networkSymbol, tokens);
    }

    return Array.from(tokensByNetwork, ([networkSymbol, tokens]) => ({ networkSymbol, tokens }));
};

// The first entry of a contract wins, as in the ranked asset list.
const toTokenMetadataByNetwork = (sources: TokenMetadataSource[]): TokenMetadataByNetwork =>
    new Map(
        sources.map(({ networkSymbol, tokens }) => [
            networkSymbol,
            new Map(tokens.toReversed().map(token => [token.contract, token])),
        ]),
    );

export const buildGlobalReceiveAssetSearchIndex = (
    assets: readonly TradingAssetOption[],
    definitions: RankedTokenStructure,
) => {
    const tokensByNetwork = toTokenMetadataByNetwork(
        rankedTokenDefinitionsToTokenMetadataSources(definitions),
    );

    return buildTradeableAssetSearchIndex({
        assets,
        getSearchFields: asset => getTradingAssetSearchFields(asset, tokensByNetwork),
    });
};

const compareHeldAssets = (
    balances: TradeableAssetBalances,
    assetA: TradingAssetOption,
    assetB: TradingAssetOption,
): number => {
    const fiatAmountA = balances.get(assetA.id)?.fiatAmount ?? null;
    const fiatAmountB = balances.get(assetB.id)?.fiatAmount ?? null;

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
    assets,
    balances,
    assetIdsWithHistory = EMPTY_ASSET_IDS_WITH_HISTORY,
    search,
    searchIndex,
    networkSymbols,
    otherAssetsLimit = Infinity,
}: GetGlobalReceiveAssetSectionsParams): GlobalReceiveAssetSections => {
    const query = normalizeForSearch(search);
    const heldAssets: TradingAssetOption[] = [];
    const assetsWithHistory: GlobalReceiveAssetListItem[] = [];
    const nativeAssets: GlobalReceiveAssetListItem[] = [];
    const tokenAssets: GlobalReceiveAssetListItem[] = [];
    let otherAssetsCount = 0;
    let hasMoreOtherAssets = false;

    assets.forEach(asset => {
        if (networkSymbols?.length && !networkSymbols.includes(asset.networkSymbol)) {
            return;
        }

        if (query) {
            const fields = searchIndex.get(asset);
            if (
                !fields ||
                !(
                    fields.name.includes(query) ||
                    fields.symbol.includes(query) ||
                    fields.networkName.includes(query) ||
                    fields.networkSymbol.includes(query) ||
                    fields.contractAddress.includes(query)
                )
            ) {
                return;
            }
        }

        if (balances.has(asset.id)) {
            heldAssets.push(asset);
        } else if (assetIdsWithHistory.has(asset.id)) {
            assetsWithHistory.push({ asset, balance: ZERO_ASSET_BALANCE });
        } else if (otherAssetsCount < otherAssetsLimit) {
            otherAssetsCount++;

            if (asset.isNativeToken) {
                nativeAssets.push({ asset, balance: undefined });
            } else {
                tokenAssets.push({ asset, balance: undefined });
            }
        } else {
            hasMoreOtherAssets = true;
        }
    });

    const fundedAssets = heldAssets
        .toSorted((assetA, assetB) => compareHeldAssets(balances, assetA, assetB))
        .map(asset => ({ asset, balance: balances.get(asset.id) }));

    return {
        myAssets: [...fundedAssets, ...assetsWithHistory],
        otherAssets: [...nativeAssets, ...tokenAssets],
        hasMoreOtherAssets,
    };
};
