import BigNumber from 'bignumber.js';
import { CoinFiatRates } from '@wallet-types';

type FiatRates = NonNullable<CoinFiatRates['current']>['rates'];

export const toFiatCurrency = (
    amount: string,
    fiatCurrency: string,
    networkRates: FiatRates | undefined,
    decimals = 2,
) => {
    // calculate amount in local currency

    const rate = networkRates?.[fiatCurrency];
    if (!rate) {
        return null;
    }

    let formattedAmount = amount;
    if (typeof amount === 'string') {
        formattedAmount = amount.replace(',', '.');
    }

    const localAmount = new BigNumber(formattedAmount).times(rate);

    return localAmount.isNaN() ? null : localAmount.toFixed(decimals === -1 ? undefined : decimals);
};

export const fromFiatCurrency = (
    localAmount: string,
    fiatCurrency: string,
    networkRates: FiatRates | undefined,
    decimals: number,
) => {
    const rate = networkRates?.[fiatCurrency];
    if (!rate) {
        return null;
    }

    let formattedLocalAmount = localAmount;
    if (typeof localAmount === 'string') {
        formattedLocalAmount = localAmount.replace(',', '.');
    }

    const amount = new BigNumber(formattedLocalAmount).div(rate);
    const amountStr = amount.isNaN() ? null : amount.toFixed(decimals);
    return amountStr;
};
