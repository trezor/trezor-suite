import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useGroupedAssetOptions } from './useGroupedAssetOptions';
import { useSellAssetRows } from './useSellAssetRows';
import {
    useAccountsWithTokenDisplayNames,
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from '../../../../../../../../../components/suite/asset-picker/hooks';
import { type AssetGroupKey } from '../../../../../../../../../components/suite/asset-picker/utils/assetGroupKey';

export type UseBuildTradingAssetOptionsProps = {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
    expandedGroupKeys: AssetGroupKey[];
};

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
    expandedGroupKeys,
}: UseBuildTradingAssetOptionsProps) {
    const { networks, assetRows } = useSellAssetRows({ networkSymbolFilter: networkSymbol });

    const assetRowsWithDisplayNames = useAccountsWithTokenDisplayNames(assetRows);
    const filteredAssetRows = useFilterAccountsWithTokens({
        accountsWithTokens: assetRowsWithDisplayNames,
        search,
        shouldKeepAccountWithMatchedToken: false,
    });
    const groupedAssetOptions = useGroupedAssetOptions(filteredAssetRows, expandedGroupKeys);
    const listItems = useInsertGroupLabelsAndSpaces(groupedAssetOptions);

    return { listItems, networks };
}
