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
import { NoTokens } from '../../common/NoTokens';
import { TokenList } from '../../common/TokenList';
import { Translation } from 'src/components/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

interface CoinsTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const CoinsTable = ({ selectedAccount, searchQuery }: CoinsTableProps) => {
    const fiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);

    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const isDebug = useSelector(selectIsDebugModeActive);

    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        localCurrency,
        account.symbol,
        fiatRates,
    );
    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);

    const tokens = getTokens(sortedTokens, account.symbol, isDebug, coinDefinitions, searchQuery);

    return tokens.shown.length > 0 || searchQuery ? (
        <TokenList
            account={account}
            hideRates={isTestnet(account.symbol)}
            tokenStatusType={TokenManagementAction.HIDE}
            tokens={tokens.shown}
            network={network}
            searchQuery={searchQuery}
        />
    ) : (
        <NoTokens
            title={
                <Translation
                    id={
                        tokens.unverified.length + tokens.hidden.length > 0
                            ? 'TR_TOKENS_EMPTY_CHECK_HIDDEN'
                            : 'TR_TOKENS_EMPTY'
                    }
                />
            }
        />
    );
};
