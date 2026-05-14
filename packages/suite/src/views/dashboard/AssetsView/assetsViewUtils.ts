import { type TokenDefinition } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type RatesByKey } from '@suite-common/wallet-types';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export const handleTokensAndStakingData = (
    assetTokens: TokenInfo[],
    accountsThatStaked: Account[],
    isStakingActive: boolean,
    symbol: NetworkSymbol,
    baseCurrencyCode: BaseCurrencyCode,
    coinDefinitions?: TokenDefinition,
    currentFiatRates?: RatesByKey,
) => {
    const assetStakingBalance = accountsThatStaked.reduce(
        (total, account) => total.plus(getAccountTotalStakingBalance(account) ?? '0'),
        new BigNumber(0),
    );
    const tokens = getTokens({
        tokens: assetTokens ?? [],
        symbol,
        tokenDefinitions: coinDefinitions,
    });
    const tokensWithRates = enhanceTokensWithRates(
        tokens.shownWithBalance ?? [],
        baseCurrencyCode,
        symbol,
        currentFiatRates,
    );
    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);
    const tokensFiatBalance = sortedTokens.reduce(
        (total, token) => total.plus(token?.fiatValue ?? 0),
        new BigNumber(0),
    );

    const shouldRenderStakingRow =
        accountsThatStaked.length > 0 && assetStakingBalance.gt(0) && isStakingActive;
    const shouldRenderTokenRow = tokens.shownWithBalance?.length > 0 && tokensFiatBalance.gt(0);

    return {
        tokensFiatBalance,
        assetStakingBalance,
        shouldRenderStakingRow,
        shouldRenderTokenRow,
    };
};
