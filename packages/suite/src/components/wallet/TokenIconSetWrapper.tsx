import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { TokenIconSet } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import {
    type TokensWithRates,
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

type TokenIconSetWrapperProps = {
    accounts: Account[];
    symbol: NetworkSymbol;
};

export const TokenIconSetWrapper = ({ accounts, symbol }: TokenIconSetWrapperProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const allTokensWithRates = accounts.flatMap(account =>
        enhanceTokensWithRates(account.tokens, baseCurrencyCode, symbol, fiatRates),
    );

    if (!allTokensWithRates.length) return null;

    const tokens = getTokens<TokensWithRates>({
        tokens: allTokensWithRates,
        symbol,
        tokenDefinitions: coinDefinitions,
    })?.shownWithBalance;

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

    return (
        <TokenIconSet
            size={20}
            gap={6}
            symbol={symbol}
            tokens={sortedAggregatedTokens}
            isCentered
        />
    );
};
