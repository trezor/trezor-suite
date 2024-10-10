import { selectCoinDefinitions } from '@suite-common/token-definitions';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { TokenIconSet } from '@trezor/product-components';
import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

type TokenIconSetWrapperProps = {
    account: Account;
};

export const TokenIconSetWrapper = ({ account }: TokenIconSetWrapperProps) => {
    const { tokens: accountTokens, symbol: network } = account;
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, network));
    const localCurrency = useSelector(selectLocalCurrency);
    const tokensWithRates = enhanceTokensWithRates(
        accountTokens,
        localCurrency,
        network,
        fiatRates,
    );
    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);
    const tokens = getTokens(sortedTokens, network, coinDefinitions);

    return <TokenIconSet network={network} tokens={tokens.shownWithBalance} />;
};
