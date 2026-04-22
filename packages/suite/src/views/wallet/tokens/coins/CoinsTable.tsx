import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isErc4626, isTestnet } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

import { NoTokens } from '../common/NoTokens';
import { TokensTable } from '../common/TokensTable/TokensTable';

interface CoinsTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const CoinsTable = ({ selectedAccount, searchQuery }: CoinsTableProps) => {
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const enhancedTokens = useMemo(() => {
        const accountTokens = account.tokens?.filter(token => !isErc4626(token));

        const tokensWithRates = enhanceTokensWithRates(
            accountTokens,
            baseCurrencyCode,
            account.symbol,
            fiatRates,
        );

        return tokensWithRates.sort(sortTokensWithRates);
    }, [account.tokens, account.symbol, baseCurrencyCode, fiatRates]);

    const tokens = useMemo(
        () =>
            getTokens({
                tokens: enhancedTokens,
                symbol: account.symbol,
                tokenDefinitions: coinDefinitions,
                searchQuery,
            }),
        [enhancedTokens, account.symbol, coinDefinitions, searchQuery],
    );

    const hiddenTokensCount =
        tokens.unverifiedWithBalance.length +
        tokens.hiddenWithBalance.length +
        tokens.unverifiedWithoutBalance.length +
        tokens.hiddenWithoutBalance.length;

    return tokens.shownWithBalance.length > 0 ||
        tokens.shownWithoutBalance.length > 0 ||
        searchQuery ? (
        <TokensTable
            account={account}
            hideRates={isTestnet(account.symbol)}
            tokenStatusType={TokenManagementAction.HIDE}
            tokensWithBalance={tokens.shownWithBalance}
            tokensWithoutBalance={tokens.shownWithoutBalance}
            network={network}
            searchQuery={searchQuery}
        />
    ) : (
        <NoTokens
            title={
                <Translation
                    id={hiddenTokensCount > 0 ? 'TR_TOKENS_EMPTY_CHECK_HIDDEN' : 'TR_TOKENS_EMPTY'}
                />
            }
        />
    );
};
