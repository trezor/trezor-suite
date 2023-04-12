import BigNumber from 'bignumber.js';

import { Account, CoinFiatRates } from '@suite-common/wallet-types';
import { TokenInfo, FiatRates } from '@trezor/connect';

interface TokensWithRates extends TokenInfo {
    rates?: FiatRates;
}

const getBalanceInUSD = (balance: TokenInfo['balance'], rate?: FiatRates['usd']) =>
    new BigNumber(balance || 0).multipliedBy(rate || 0);

// sort by 1. total fiat, 2. token price, 3. symbol length, 4. alphabetically
export const sortTokensWithRates = (a: TokensWithRates, b: TokensWithRates) => {
    const aBalanceUSD = getBalanceInUSD(a.balance, a.rates?.usd);
    const bBalanceUSD = getBalanceInUSD(b.balance, b.rates?.usd);

    const balanceSort =
        // Sort by balance multiplied by USD rate
        bBalanceUSD.minus(aBalanceUSD).toNumber() ||
        // If balance is equal, sort by USD rate
        (b.rates?.usd || -1) - (a.rates?.usd || -1) ||
        // If USD rate is equal or missing, sort by symbol length
        (a.symbol || '').length - (b.symbol || '').length ||
        // If symbol length is equal, sort by symbol name alphabetically
        (a.symbol || '').localeCompare(b.symbol || '');

    return balanceSort;
};

export const enhanceTokensWithRates = (tokens: Account['tokens'], coins: CoinFiatRates[]) => {
    if (!tokens?.length) return [];

    const tokensWithRates = tokens.map(token => ({
        ...token,
        rates: coins.find(coin => coin.tokenAddress?.toLowerCase() === token.contract.toLowerCase())
            ?.current?.rates,
    }));

    return tokensWithRates;
};
