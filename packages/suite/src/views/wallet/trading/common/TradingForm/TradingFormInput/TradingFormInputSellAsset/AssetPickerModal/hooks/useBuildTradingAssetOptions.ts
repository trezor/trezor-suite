import { type NetworkSymbol } from '@suite-common/wallet-config';

import {
    useAccountsWithTokenDisplayNames,
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';

import { useAccountWithTokensOptions } from './useAccountWithTokensOptions';
import { useGroupedAssetOptions } from './useGroupedAssetOptions';
import { useAssetsContext } from '../../AssetOptionsContext';
import { type AssetGroupKey } from '../utils/buildGroupedAssetOptions';

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
    expandedGroupKeys: AssetGroupKey[];
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
    expandedGroupKeys,
}: UseBuildTradingAssetOptionsProps) {
    const { excludedCryptoIds } = useAssetsContext();

    const { networks, assetRows } = useAccountWithTokensOptions({
        networkSymbolFilter: networkSymbol,
        excludedCryptoIds,
    });

    const assetRowsWithDisplayNames = useAccountsWithTokenDisplayNames(assetRows);
    const filteredAssetRows = useFilterAccountsWithTokens(assetRowsWithDisplayNames, search);
    const groupedAssetOptions = useGroupedAssetOptions(filteredAssetRows, expandedGroupKeys);
    const listItems = useInsertGroupLabelsAndSpaces(groupedAssetOptions);

    return { listItems, networks };
}
