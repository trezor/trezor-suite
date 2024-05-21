import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import {
    TokenManagementAction,
    isTokenDefinitionKnown,
    selectCoinDefinitions,
} from '@suite-common/token-definitions';

import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { enhanceTokensWithRates, sortTokensWithRates } from 'src/utils/wallet/tokenUtils';
import { useSelector } from 'src/hooks/suite';
import { NoTokens } from '../../common/NoTokens';
import { TokenList } from '../../common/TokenList';

interface HiddenTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
}

export const HiddenTokensTable = ({ selectedAccount }: HiddenTokensTableProps) => {
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
    const hasCoinDefinitions = getNetworkFeatures(account.symbol).includes('coin-definitions');

    const tokens = sortedTokens.filter(
        token =>
            hasCoinDefinitions &&
            (!isTokenDefinitionKnown(coinDefinitions?.data, account.symbol, token.contract) ||
                coinDefinitions?.hide.some(contract => contract === token.contract)),
    );

    return tokens.length > 0 ? (
        <TokenList
            hideRates
            tokenStatusType={TokenManagementAction.SHOW}
            tokens={tokens}
            network={network}
        />
    ) : (
        <NoTokens />
    );
};
