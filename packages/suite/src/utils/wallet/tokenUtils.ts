import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Account, Rate, TokenAddress, RatesByKey } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/connect';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    EnhancedTokenInfo,
    TokenDefinition,
    isTokenDefinitionKnown,
} from '@suite-common/token-definitions';

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
    rates?: RatesByKey,
) => {
    if (!tokens?.length) return [];

    const tokensWithRates = tokens.map(token => {
        const tokenFiatRateKey = getFiatRateKey(
            symbol,
            fiatCurrency,
            token.contract as TokenAddress,
        );
        const fiatRate = rates?.[tokenFiatRateKey];

        const fiatValue = new BigNumber(token.balance || 0).multipliedBy(fiatRate?.rate || 0);

        return {
            ...token,
            fiatRate,
            fiatValue,
        };
    });

    return tokensWithRates;
};

export const formatTokenSymbol = (symbol: string) => {
    const upperCasedSymbol = symbol.toUpperCase();
    const isTokenSymbolLong = upperCasedSymbol.length > 7;

    return isTokenSymbolLong ? `${upperCasedSymbol.slice(0, 7)}...` : upperCasedSymbol;
};

export const getTokens = (
    tokens: EnhancedTokenInfo[] | TokenInfo[],
    symbol: NetworkSymbol,
    isDebug: boolean,
    coinDefinitions?: TokenDefinition,
) => {
    const hasCoinDefinitions = getNetworkFeatures(symbol).includes('coin-definitions');

    const shown: EnhancedTokenInfo[] = [];
    const hidden: EnhancedTokenInfo[] = [];
    const unverified: EnhancedTokenInfo[] = [];

    tokens.forEach(token => {
        if (token.balance === '0' && !isDebug) return false;

        const isKnown = isTokenDefinitionKnown(coinDefinitions?.data, symbol, token.contract);
        const isHidden = coinDefinitions?.hide.includes(token.contract);
        const isShown = coinDefinitions?.show.includes(token.contract);

        if (!hasCoinDefinitions || (isKnown && !isHidden) || isShown) {
            shown.push(token);
        } else if (hasCoinDefinitions && !isKnown && !isShown) {
            unverified.push(token);
        } else if (isKnown && isHidden) {
            hidden.push(token);
        }
    });

    return { shown, hidden, unverified };
};
