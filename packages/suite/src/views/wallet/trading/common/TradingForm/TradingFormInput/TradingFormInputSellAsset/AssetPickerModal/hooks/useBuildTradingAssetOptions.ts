import { useCallback } from 'react';

import { CryptoId } from 'invity-api';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import {
    useAccountWithTokensOptions,
    useFilterAccountsWithTokens,
    useInsertGroupLabelsAndSpaces,
} from 'src/components/suite/asset-picker/hooks';
import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
    enabledCryptoIds?: Set<CryptoId>;
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
    enabledCryptoIds,
}: UseBuildTradingAssetOptionsProps) {
    const tokenDefinitions = useSelector(selectTokenDefinitions);
    const accountFilter = useCallback(
        (account: Account) => {
            if (isTestnet(account.symbol) || account.accountType === 'coinjoin') {
                return false;
            }

            if (account.tokens?.length === 0) {
                return new BigNumber(account.balance).gt(0);
            }

            const tokens = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            return tokens.shownWithBalance.length > 0;
        },
        [tokenDefinitions],
    );
    const { networks, accountsWithTokens } = useAccountWithTokensOptions({
        networkSymbolFilter: networkSymbol,
        accountFilter,
        enabledCryptoIds,
    });
    const filteredAccountsWithTokens = useFilterAccountsWithTokens(accountsWithTokens, search);
    const listItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    return { listItems, networks };
}
