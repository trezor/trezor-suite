import { useMemo } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { union } from '@trezor/utils';

import {
    useAccountWithTokensOptions,
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
}: UseBuildTradingAssetOptionsProps) {
    const accountsWithTokens = useAccountWithTokensOptions({
        networkSymbolFilter: networkSymbol,
        includeTestnets: false,
    });
    const filteredAccountsWithTokens = useFilterAccountsWithTokens(accountsWithTokens, search);
    const listItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);
    const networks = useMemo(
        () =>
            union(
                accountsWithTokens
                    .filter(item => item.type === 'account')
                    .map(item => item.account.symbol),
            ),
        [accountsWithTokens],
    );

    return { listItems, networks };
}
