import { useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import { useChainAssets, useSelectedChainNetworks } from '@suite-common/chain-data';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { selectAllAccountsToList, selectBaseCurrency } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { filterShownChainTokens } from 'src/views/dashboard/ChainAssetsList/filterShownChainTokens';
import {
    type NetworkAssetGroup,
    groupChainAssetsByNetwork,
} from 'src/views/dashboard/ChainAssetsList/groupChainAssetsByNetwork';

import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';

export type DashboardChainAssets = {
    isEnabled: boolean;
    groups: readonly NetworkAssetGroup[];
    isPending: boolean;
    hasErrors: boolean;
};

/**
 * The listed accounts' assets from chain networks, grouped per network as the dashboard does
 * today. With the `queryChainData` flag off it fetches nothing.
 */
export const useDashboardChainAssets = (): DashboardChainAssets => {
    const isEnabled = useSelector(selectIsQueryChainDataEnabled);
    const currency = useSelector(selectBaseCurrency);
    const listedAccounts = useSelector(selectAllAccountsToList);
    const tokenDefinitions = useSelector(selectTokenDefinitions);
    const networks = useSelectedChainNetworks();

    const { accounts } = useLegacyPortfolioAccounts(listedAccounts);

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

    return {
        isEnabled,
        groups,
        isPending: chainAssets.isPending,
        hasErrors: chainAssets.hasErrors,
    };
};
