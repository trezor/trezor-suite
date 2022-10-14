import BigNumber from 'bignumber.js';

import { CoinFiatRates } from '@suite-common/wallet-types';

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

    console.log(amount, 'amount');
    const formattedAmount = amount.replace(',', '.');
    const fiatAmount = new BigNumber(formattedAmount).times(rate);
    if (fiatAmount.isNaN()) {
        return null;
    }
    return decimals === -1 ? fiatAmount.toFixed() : fiatAmount.toFixed(decimals);
};

export const fromFiatCurrency = (
    fiatAmount: string,
    fiatCurrency: string,
    networkRates: FiatRates | undefined,
    decimals: number,
) => {
    const rate = networkRates?.[fiatCurrency];
    if (!rate) {
        return null;
    }

    const formattedLocalAmount = fiatAmount.replace(',', '.');

    const amount = new BigNumber(formattedLocalAmount).div(rate);
    const amountStr = amount.isNaN() ? null : amount.toFixed(decimals);
    return amountStr;
};
