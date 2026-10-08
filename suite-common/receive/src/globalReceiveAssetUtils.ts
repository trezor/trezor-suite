import { normalizeForSearch } from '@suite-common/suite-utils';
import {
    type RankedTokenStructure,
    buildNetworkAssetCatalog,
} from '@suite-common/token-definitions';
import {
    type TradeableAssetBalance,
    type TradeableAssetBalances,
    type TradeableAssetSearchFields,
    type TradeableAssetSearchIndex,
    type TradingAssetOption,
    buildTradeableAssetSearchIndex,
    createAssetNativeTokenOption,
    createAssetTokenOption,
} from '@suite-common/trading';
import {
    type Network,
    type NetworkSymbol,
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
    const assets: TradingAssetOption[] = [];
    const includedIds = new Set<string>();

    buildNetworkAssetCatalog({ networks, definitions }).forEach(
        ({ networkSymbol, symbol, name, contract }) => {
            const asset =
                contract === undefined
                    ? createAssetNativeTokenOption(toNetworkSymbolNonTestnet(networkSymbol))
                    : createAssetTokenOption(networkSymbol, { contract, symbol, name });

            // Trading IDs can group distinct Cardano contracts under the same policy.
            if (asset.isNativeToken || !includedIds.has(asset.id)) {
                assets.push(asset);
                includedIds.add(asset.id);
            }
        },
    );

    return assets;
};

export type GlobalReceiveAssetListItem = {
    asset: TradingAssetOption;
    balance: TradeableAssetBalance | undefined;
};

export type GlobalReceiveAssetSections = {
    myAssets: GlobalReceiveAssetListItem[];
    otherAssets: GlobalReceiveAssetListItem[];
};

export const getGlobalReceiveAssetDescriptionValues = (
    asset: TradingAssetOption,
): { assetName: string; networkName?: string } => {
    const assetName = asset.displaySymbolName ?? asset.name;

    return asset.isNativeToken ? { assetName } : { assetName, networkName: asset.networkName };
};

type GetGlobalReceiveAssetSectionsParams = {
    assets: readonly TradingAssetOption[];
    balances: TradeableAssetBalances;
    assetIdsWithHistory?: ReadonlySet<string>;
    search: string;
    searchIndex?: TradeableAssetSearchIndex<TradingAssetOption>;
    networkSymbol: NetworkSymbol | undefined;
};

const EMPTY_ASSET_IDS_WITH_HISTORY: ReadonlySet<string> = new Set();
const ZERO_ASSET_BALANCE: TradeableAssetBalance = {
    cryptoAmount: '0',
    fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
};

const getAssetSearchFields = (asset: TradingAssetOption): TradeableAssetSearchFields => ({
    name: asset.displaySymbolName ?? asset.name,
    symbol: asset.displaySymbol,
    networkName: asset.networkName,
    networkSymbol: asset.networkSymbol,
    contractAddress: asset.contractAddress ?? '',
});

export const buildGlobalReceiveAssetSearchIndex = (assets: readonly TradingAssetOption[]) =>
    buildTradeableAssetSearchIndex({ assets, getSearchFields: getAssetSearchFields });

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
    searchIndex = buildGlobalReceiveAssetSearchIndex(assets),
    networkSymbol,
}: GetGlobalReceiveAssetSectionsParams): GlobalReceiveAssetSections => {
    const query = normalizeForSearch(search);
    const heldAssets: TradingAssetOption[] = [];
    const assetsWithHistory: GlobalReceiveAssetListItem[] = [];
    const nativeAssets: GlobalReceiveAssetListItem[] = [];
    const tokenAssets: GlobalReceiveAssetListItem[] = [];

    assets.forEach(asset => {
        if (networkSymbol && asset.networkSymbol !== networkSymbol) {
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
        } else if (asset.isNativeToken) {
            nativeAssets.push({ asset, balance: undefined });
        } else {
            tokenAssets.push({ asset, balance: undefined });
        }
    });

    const fundedAssets = heldAssets
        .toSorted((assetA, assetB) => compareHeldAssets(balances, assetA, assetB))
        .map(asset => ({ asset, balance: balances.get(asset.id) }));

    return {
        myAssets: [...fundedAssets, ...assetsWithHistory],
        otherAssets: [...nativeAssets, ...tokenAssets],
    };
};
