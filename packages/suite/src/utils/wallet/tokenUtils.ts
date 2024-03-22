import BigNumber from 'bignumber.js';

import { Account, Rate, TokenAddress, FiatRates } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/connect';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config';

interface TokensWithRates extends TokenInfo {
    fiatValue: BigNumber;
    fiatRate?: Rate;
}

// sort by 1. total fiat, 2. token price, 3. symbol length, 4. alphabetically
export const sortTokensWithRates = (a: TokensWithRates, b: TokensWithRates) => {
    const balanceSort =
        // Sort by balance multiplied by USD rate
        b.fiatValue.minus(a.fiatValue).toNumber() ||
        // If balance is equal, sort by USD rate
        (b.fiatRate?.rate || -1) - (a.fiatRate?.rate || -1) ||
        // If USD rate is equal or missing, sort by symbol length
        (a.symbol || '').length - (b.symbol || '').length ||
        // If symbol length is equal, sort by symbol name alphabetically
        (a.symbol || '').localeCompare(b.symbol || '');

    return balanceSort;
};

export const enhanceTokensWithRates = (
    tokens: Account['tokens'],
    fiatCurrency: FiatCurrencyCode,
    symbol: NetworkSymbol,
    rates: FiatRates | undefined,
) => {
    if (!tokens?.length) return [];

    const tokensWithRates = tokens.map(token => {
        const tokenFiatRateKey = getFiatRateKey(
            symbol,
            fiatCurrency,
            token.contract as TokenAddress,
        );
        const tokenFiatRate = rates?.[tokenFiatRateKey];

        const fiatValue = new BigNumber(token.balance || 0).multipliedBy(tokenFiatRate?.rate || 0);

        return {
            ...token,
            tokenFiatRate,
            fiatValue,
        };
    });

    return tokensWithRates;
};
