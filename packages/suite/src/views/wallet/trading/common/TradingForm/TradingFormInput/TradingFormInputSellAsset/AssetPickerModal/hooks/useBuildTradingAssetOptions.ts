import { useCallback, useMemo } from 'react';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId } from '@suite-common/trading';
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

import { useAssetsContext } from '../../AssetOptionsContext';

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
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
    });
    const { includedCryptoIds, excludedCryptoIds } = useAssetsContext();
    const supportedCryptoIds = useMemo(() => {
        const supportedCryptoIds = new Set(includedCryptoIds);

        excludedCryptoIds.forEach(cryptoId => {
            supportedCryptoIds.delete(cryptoId);
        });

        return supportedCryptoIds;
    }, [includedCryptoIds, excludedCryptoIds]);
    const supportedAccountsWithTokens = useMemo(
        () =>
            accountsWithTokens.filter(option => {
                const cryptoId =
                    option.type === 'account'
                        ? getCryptoId(option.account.symbol)
                        : getCryptoId(option.account.symbol, option.token?.contract);

                return supportedCryptoIds.has(cryptoId);
            }),
        [accountsWithTokens, supportedCryptoIds],
    );

    const filteredAccountsWithTokens = useFilterAccountsWithTokens(
        supportedAccountsWithTokens,
        search,
    );
    const listItems = useInsertGroupLabelsAndSpaces(filteredAccountsWithTokens);

    return { listItems, networks };
}
