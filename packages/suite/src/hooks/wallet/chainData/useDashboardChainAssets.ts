import { useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import {
    type ChainAsset,
    useChainAssets,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { selectAllAccountsToList, selectBaseCurrency } from '@suite-common/wallet-core';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';

import { useSelector } from 'src/hooks/suite';
import { addRuntimeEvmChainAccounts } from 'src/support/runtimeEvmNetworks/addRuntimeEvmChainAccounts';
import { filterShownChainTokens } from 'src/views/dashboard/ChainAssetsList/filterShownChainTokens';
import {
    type NetworkAssetGroup,
    groupChainAssetsByNetwork,
} from 'src/views/dashboard/ChainAssetsList/groupChainAssetsByNetwork';

import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';
import { useRuntimeEvmNetworkRegistry } from './useRuntimeEvmNetworkRegistry';

export type DashboardChainAssets = {
    isEnabled: boolean;
    groups: readonly NetworkAssetGroup[];
    isPending: boolean;
    hasErrors: boolean;

    /** The runtime EVM networks among the groups, by symbol: they are not in the app's config. */
    runtimeNetworks: ReadonlyMap<string, RuntimeEvmNetworkDefinition>;

    /** Each runtime network's coin per account, by symbol: what a send starts from. */
    runtimeAccountAssets: ReadonlyMap<string, readonly ChainAsset[]>;
};

/**
 * The listed accounts' assets from chain networks, grouped per network as the dashboard does
 * today, plus the runtime EVM networks the user turned on, read at the Ethereum accounts'
 * addresses. With the `queryChainData` flag off it fetches nothing.
 */
export const useDashboardChainAssets = (): DashboardChainAssets => {
    const isEnabled = useSelector(selectIsQueryChainDataEnabled);
    const currency = useSelector(selectBaseCurrency);
    const listedAccounts = useSelector(selectAllAccountsToList);
    const tokenDefinitions = useSelector(selectTokenDefinitions);
    const runtimeEvmNetworks = useRuntimeEvmNetworkRegistry().snapshot.enabledDefinitions;
    const networks = useSelectedChainNetworks();

    const { accounts: legacyAccounts } = useLegacyPortfolioAccounts(listedAccounts);
    const accounts = useMemo(
        () => addRuntimeEvmChainAccounts(legacyAccounts, runtimeEvmNetworks),
        [legacyAccounts, runtimeEvmNetworks],
    );
    const runtimeNetworks = useMemo(
        () => new Map(runtimeEvmNetworks.map(definition => [definition.symbol, definition])),
        [runtimeEvmNetworks],
    );

    const chainAssets = useChainAssets({ networks, accounts, currency, enabled: isEnabled });

    const groups = useMemo(
        () =>
            groupChainAssetsByNetwork(
                filterShownChainTokens(
                    chainAssets.assets,
                    symbol => tokenDefinitions[symbol]?.coin,
                ),
            ),
        [chainAssets.assets, tokenDefinitions],
    );

    const runtimeAccountAssets = useMemo(() => {
        const assetsBySymbol = new Map<string, ChainAsset[]>();
        chainAssets.assets
            .filter(asset => asset.kind === 'native' && runtimeNetworks.has(asset.ref.symbol))
            .forEach(asset => {
                const assets = assetsBySymbol.get(asset.ref.symbol) ?? [];
                assetsBySymbol.set(asset.ref.symbol, [...assets, asset]);
            });

        return assetsBySymbol;
    }, [chainAssets.assets, runtimeNetworks]);

    return {
        isEnabled,
        groups,
        isPending: chainAssets.isPending,
        hasErrors: chainAssets.hasErrors,
        runtimeNetworks,
        runtimeAccountAssets,
    };
};
