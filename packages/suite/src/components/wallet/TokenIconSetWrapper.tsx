import { selectCoinDefinitions } from '@suite-common/token-definitions';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
    TokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { TokenIconSet } from '@trezor/product-components';
import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

type TokenIconSetWrapperProps = {
    accounts: Account[];
    network: NetworkSymbol;
};

export const TokenIconSetWrapper = ({ accounts, network }: TokenIconSetWrapperProps) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, network));

    const allTokensWithRates = accounts.flatMap(account =>
        enhanceTokensWithRates(account.tokens, localCurrency, network, fiatRates),
    );

    if (!allTokensWithRates.length) return null;

    const tokens = getTokens(allTokensWithRates, network, coinDefinitions)
        .shownWithBalance as TokensWithRates[];

    const aggregatedTokens = Object.values(
        tokens.reduce((acc: Record<string, TokensWithRates>, token) => {
            const { contract, balance, fiatValue } = token;

            if (!acc[contract]) {
                acc[contract] = {
                    ...token,
                    balance: balance ?? '0',
                    fiatValue: fiatValue ?? BigNumber(0),
                };
            } else {
                const existingBalance = parseFloat(acc[contract].balance ?? '0');
                const newBalance = existingBalance + parseFloat(balance ?? '0');
                acc[contract].balance = newBalance.toString();

                acc[contract].fiatValue = acc[contract].fiatValue.plus(fiatValue);
            }

            return acc;
        }, {}),
    );

    const sortedAggregatedTokens = aggregatedTokens.sort(sortTokensWithRates);

    return <TokenIconSet network={network} tokens={sortedAggregatedTokens} />;
};
