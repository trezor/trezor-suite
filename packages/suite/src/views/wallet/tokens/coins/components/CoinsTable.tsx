import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';

import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import {
    enhanceTokensWithRates,
    getShownTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { useSelector } from 'src/hooks/suite';
import { NoTokens } from '../../common/NoTokens';
import { TokenList } from '../../common/TokenList';

interface CoinsTableProps {
    selectedAccount: SelectedAccountLoaded;
}

export const CoinsTable = ({ selectedAccount }: CoinsTableProps) => {
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

    const tokens = getShownTokens(sortedTokens, account.symbol, coinDefinitions);

    return tokens.length > 0 ? (
        <TokenList
            hideRates={isTestnet(account.symbol)}
            tokenStatusType={TokenManagementAction.HIDE}
            tokens={tokens}
            network={network}
        />
    ) : (
        <NoTokens />
    );
};
