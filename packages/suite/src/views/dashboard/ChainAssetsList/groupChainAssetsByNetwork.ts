import { type ChainAsset } from '@suite-common/chain-data';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

export type AssetTotal = {
    readonly symbol?: string;
    readonly name?: string;
    readonly contract?: string;
    readonly decimals?: number;
    readonly amount: string;

    /** `null` when any part has no known value. */
    readonly fiatValue: string | null;
};

export type NetworkAssetGroup = {
    readonly symbol: NetworkSymbol;
    readonly native: AssetTotal | null;
    readonly tokens: readonly AssetTotal[];
};

const addToTotal = (total: AssetTotal | undefined, asset: ChainAsset): AssetTotal => ({
    symbol: asset.symbol,
    name: asset.name,
    contract: asset.contract,
    decimals: asset.decimals,
    amount: new BigNumber(total?.amount ?? 0).plus(asset.amount).toString(10),
    fiatValue:
        asset.fiatValue === null || total?.fiatValue === null
            ? null
            : new BigNumber(total?.fiatValue ?? 0).plus(asset.fiatValue).toString(10),
});

type MutableGroup = { native?: AssetTotal; tokens: Map<string, AssetTotal> };

/**
 * Groups assets the way the dashboard does today: one group per network, its native coin summed
 * over accounts and each token summed by contract. An asset-first view would be another grouping
 * over the same list, merging across networks instead.
 */
export const groupChainAssetsByNetwork = (assets: readonly ChainAsset[]): NetworkAssetGroup[] => {
    const groups = new Map<NetworkSymbol, MutableGroup>();

    assets.forEach(asset => {
        const group: MutableGroup = groups.get(asset.ref.symbol) ?? { tokens: new Map() };
        groups.set(asset.ref.symbol, group);

        if (asset.kind === 'native') {
            group.native = addToTotal(group.native, asset);

            return;
        }

        const contract = asset.contract ?? '';
        group.tokens.set(contract, addToTotal(group.tokens.get(contract), asset));
    });

    return [...groups].map(([symbol, group]) => ({
        symbol,
        native: group.native ?? null,
        tokens: [...group.tokens.values()],
    }));
};
