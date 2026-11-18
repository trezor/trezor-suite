import { type TokenDefinition } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type RatesByKey } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from '#src/utils/wallet/tokenUtils';

export const getAssetTokensData = (
    assetTokens: TokenInfo[],
    symbol: NetworkSymbol,
    baseCurrencyCode: BaseCurrencyCode,
    coinDefinitions?: TokenDefinition,
    currentFiatRates?: RatesByKey,
) => {
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

    const shouldRenderTokenRow = tokens.shownWithBalance?.length > 0 && tokensFiatBalance.gt(0);

    return { tokensFiatBalance, shouldRenderTokenRow };
};
