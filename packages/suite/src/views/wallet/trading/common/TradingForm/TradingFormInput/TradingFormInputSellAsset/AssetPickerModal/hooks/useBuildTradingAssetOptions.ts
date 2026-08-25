import { type NetworkSymbol } from '@suite-common/wallet-config';

import {
    useAccountsWithTokenDisplayNames,
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';
import { type AssetGroupKey } from 'src/components/suite/asset-picker/utils/assetGroupKey';

import { useGroupedAssetOptions } from './useGroupedAssetOptions';
import { useSellAssetRows } from './useSellAssetRows';
import { useAssetsContext } from '../../AssetOptionsContext';

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

    const { networks, assetRows } = useSellAssetRows({
        networkSymbolFilter: networkSymbol,
        excludedCryptoIds,
    });

    const assetRowsWithDisplayNames = useAccountsWithTokenDisplayNames(assetRows);
    const filteredAssetRows = useFilterAccountsWithTokens(assetRowsWithDisplayNames, search);
    const groupedAssetOptions = useGroupedAssetOptions(filteredAssetRows, expandedGroupKeys);
    const listItems = useInsertGroupLabelsAndSpaces(groupedAssetOptions);

    return { listItems, networks };
}
