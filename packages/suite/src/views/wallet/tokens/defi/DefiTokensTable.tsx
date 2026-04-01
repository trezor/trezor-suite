import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { useAllYieldOpportunities } from '@suite-common/earn-api';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { Banner, Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

import { TokensTable } from '../common/TokensTable/TokensTable';

interface DefiTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const DefiTokensTable = ({ selectedAccount, searchQuery }: DefiTokensTableProps) => {
    const { account, network } = selectedAccount;

    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const { yieldOpportunities } = useAllYieldOpportunities();

    const enhancedTokens = useMemo(() => {
        const erc4626Tokens = account.tokens?.filter(isErc4626);

        const tokensWithRates = enhanceTokensWithRates(
            erc4626Tokens,
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

    return (
        <Column gap={14}>
            <Banner intent="info" description={<Translation id="TR_DEFI_BANNER_TEXT" />} />

            <TokensTable
                type="defi"
                account={account}
                tokenStatusType={TokenManagementAction.SHOW}
                tokensWithBalance={tokens.shownWithBalance}
                tokensWithoutBalance={tokens.shownWithoutBalance}
                network={network}
                searchQuery={searchQuery}
                yieldOpportunities={yieldOpportunities}
            />
        </Column>
    );
};
