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
}

export const CoinsTable = ({ selectedAccount }: CoinsTableProps) => {
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

    const shownTokens = getTokens(sortedTokens, account.symbol, 'shown', isDebug, coinDefinitions);
    const unverifiedTokens = getTokens(
        sortedTokens,
        account.symbol,
        'unverified',
        isDebug,
        coinDefinitions,
    );
    const hiddenTokens = getTokens(
        sortedTokens,
        account.symbol,
        'hidden',
        isDebug,
        coinDefinitions,
    );

    return shownTokens.length > 0 ? (
        <TokenList
            account={account}
            hideRates={isTestnet(account.symbol)}
            tokenStatusType={TokenManagementAction.HIDE}
            tokens={shownTokens}
            network={network}
        />
    ) : (
        <NoTokens
            title={
                <Translation
                    id={
                        unverifiedTokens.length + hiddenTokens.length > 0
                            ? 'TR_TOKENS_EMPTY_CHECK_HIDDEN'
                            : 'TR_TOKENS_EMPTY'
                    }
                />
            }
        />
    );
};
