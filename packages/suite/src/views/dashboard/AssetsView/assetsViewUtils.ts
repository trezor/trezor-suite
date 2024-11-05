import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TokenDefinition } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';

export const handleTokensAndStakingData = (
    assetTokens: TokenInfo[],
    accountsThatStaked: Account[],
    symbol: NetworkSymbol,
    localCurrency: FiatCurrencyCode,
    coinDefinitions?: TokenDefinition,
    currentFiatRates?: RatesByKey,
) => {
    const assetStakingBalance = accountsThatStaked.reduce((total, account) => {
        return total.plus(getAccountTotalStakingBalance(account));
    }, new BigNumber(0));
    const tokens = getTokens(assetTokens ?? [], symbol, coinDefinitions);
    const tokensWithRates = enhanceTokensWithRates(
        tokens.shownWithBalance ?? [],
        localCurrency,
        symbol,
        currentFiatRates,
    );
    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);
    const tokensFiatBalance = sortedTokens.reduce((total, token) => {
        return total.plus(token?.fiatValue ?? 0);
    }, new BigNumber(0));
    const shouldRenderStakingRow = accountsThatStaked.length > 0 && assetStakingBalance.gt(0);
    const shouldRenderTokenRow = tokens.shownWithBalance?.length > 0 && tokensFiatBalance.gt(0);

    return {
        sortedTokens,
        tokensFiatBalance,
        assetStakingBalance,
        shouldRenderStakingRow,
        shouldRenderTokenRow,
    };
};
