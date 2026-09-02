import { useMemo } from 'react';

import { type TokenDefinitions, selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isReadOnlyToken } from '@suite-common/wallet-utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import {
    createAccountOption,
    createHiddenTokensOption,
    createTokenOption,
} from 'src/components/suite/asset-picker/utils';
import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import {
    type EnahncedTokenInfoWithFiat,
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

const buildTokenOptions = (
    account: Account,
    accountTokens: EnahncedTokenInfoWithFiat[],
    coinDefinitions: TokenDefinitions['coin'],
    expandedHiddenTokensGroups: AccountKey[],
): AccountWithTokensOption[] => {
    const tokens = getTokens<EnahncedTokenInfoWithFiat>({
        tokens: accountTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
    });

    const options: AccountWithTokensOption[] = [createAccountOption(account)];

    tokens.shownWithBalance.forEach(token => {
        options.push(createTokenOption(account, token));
    });

    const hiddenTokens = [...tokens.hiddenWithBalance, ...tokens.unverifiedWithBalance];

    if (hiddenTokens.length > 0) {
        options.push(
            createHiddenTokensOption({
                account,
                hiddenTokens,
                expandedHiddenTokensGroups,
            }),
        );
    }

    return options;
};

type UseBuildTokenOptionsParams = {
    account: Account;
    expandedHiddenTokensGroups: AccountKey[];
};

export function useBuildTokenOptions({
    account,
    expandedHiddenTokensGroups,
}: UseBuildTokenOptionsParams): AccountWithTokensOption[] {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    return useMemo(() => {
        const tokensWithRates = enhanceTokensWithRates(
            account.tokens,
            baseCurrencyCode,
            account.symbol,
            fiatRates,
        );

        const sortedTokensWithRates = tokensWithRates
            // read-only tokens cannot be spent, so they are not offered as a send source
            .filter(token => !isReadOnlyToken(token))
            .sort(sortTokensWithRates);

        return buildTokenOptions(
            account,
            sortedTokensWithRates,
            coinDefinitions,
            expandedHiddenTokensGroups,
        );
    }, [account, baseCurrencyCode, fiatRates, coinDefinitions, expandedHiddenTokensGroups]);
}
