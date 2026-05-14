import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';

import { useAccountWithTokensOptions } from './useAccountWithTokensOptions';
import { useAssetsContext } from '../../AssetOptionsContext';

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
    expandedNonTradableTokensGroups: AccountKey[];
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
    expandedNonTradableTokensGroups,
}: UseBuildTradingAssetOptionsProps) {
    const { includedCryptoIds, excludedCryptoIds } = useAssetsContext();
    const { networks, accountsWithTokens } = useAccountWithTokensOptions({
        networkSymbolFilter: networkSymbol,
        includedCryptoIds,
        excludedCryptoIds,
        expandedNonTradableTokensGroups,
    });

    const filteredAccountsWithTokens = useFilterAccountsWithTokens(accountsWithTokens, search);
    const listItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    return { listItems, networks };
}
