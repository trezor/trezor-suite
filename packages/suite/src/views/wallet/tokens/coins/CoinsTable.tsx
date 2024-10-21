import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';

import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { useSelector } from 'src/hooks/suite';
import { NoTokens } from '../common/NoTokens';
import { TokensTable } from '../common/TokensTable/TokensTable';
import { Translation } from 'src/components/suite';

interface CoinsTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const CoinsTable = ({ selectedAccount, searchQuery }: CoinsTableProps) => {
    const fiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);

    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        localCurrency,
        account.symbol,
        fiatRates,
    );
    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);

    const tokens = getTokens(sortedTokens, account.symbol, coinDefinitions, searchQuery);
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
