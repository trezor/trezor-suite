import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenSymbol, TokenAddress } from '@suite-common/wallet-types';

import { FiatRateKey, TickerId } from './types';

export const getFiatRateKey = (
    symbol: TokenSymbol | NetworkSymbol | undefined, // token symbol might be `undefined`
    fiatCurrency: FiatCurrencyCode,
    tokenAddress?: TokenAddress,
): FiatRateKey => {
    const lowerCaseSymbol = symbol?.toLowerCase();
    if (tokenAddress) {
        return `${lowerCaseSymbol}-${fiatCurrency}-${tokenAddress}` as FiatRateKey;
    }
    return `${lowerCaseSymbol}-${fiatCurrency}` as FiatRateKey;
};

export const getFiatRateKeyFromTicker = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): FiatRateKey => {
    const { symbol, tokenAddress } = ticker;
    return getFiatRateKey(symbol, fiatCurrency, tokenAddress);
};
