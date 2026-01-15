import { useMemo } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';

import { useAccountWithTokensOptions } from './useAccountWithTokensOptions';
import { useAssetsContext } from '../../AssetOptionsContext';

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
}: UseBuildTradingAssetOptionsProps) {
    const { includedCryptoIds, excludedCryptoIds } = useAssetsContext();
    const supportedCryptoIds = useMemo(() => {
        const supportedCryptoIds = new Set(includedCryptoIds);

        excludedCryptoIds.forEach(cryptoId => {
            supportedCryptoIds.delete(cryptoId);
        });

        return supportedCryptoIds;
    }, [includedCryptoIds, excludedCryptoIds]);

    const { networks, accountsWithTokens } = useAccountWithTokensOptions({
        networkSymbolFilter: networkSymbol,
        supportedCryptoIds,
    });

    const filteredAccountsWithTokens = useFilterAccountsWithTokens(accountsWithTokens, search);
    const listItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    return { listItems, networks };
}
