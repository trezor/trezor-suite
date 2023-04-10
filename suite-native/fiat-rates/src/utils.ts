import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenSymbol, TokenAddress } from '@suite-common/wallet-types';

import { FiatRateKey, TickerId } from './types';

export const getFiatRateKey = (
    symbol: TokenSymbol | NetworkSymbol,
    fiatCurrency: FiatCurrencyCode,
    tokenAddress?: TokenAddress,
): FiatRateKey => {
    if (tokenAddress) {
        return `${symbol}-${fiatCurrency}-${tokenAddress}` as FiatRateKey;
    }
    return `${symbol}-${fiatCurrency}` as FiatRateKey;
};

export const getFiatRateKeyFromTicker = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): FiatRateKey => {
    const { symbol, tokenAddress } = ticker;
    return getFiatRateKey(symbol, fiatCurrency, tokenAddress);
};
