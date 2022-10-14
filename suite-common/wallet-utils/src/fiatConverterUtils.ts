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
    console.log(amount, fiatCurrency, networkRates, 'to fiat currency');
    const rate = networkRates?.[fiatCurrency];
    if (!rate) {
        console.log('no rates');
        return null;
    }

    let formattedAmount = amount;
    if (typeof amount === 'string') {
        formattedAmount = amount.replace(',', '.');
    }

    const localAmount = new BigNumber(formattedAmount).times(rate);
    if (localAmount.isNaN()) {
        console.log('not a number');
        return null;
    }
    console.log(localAmount, 'local amount');
    return decimals === -1 ? localAmount.toFixed() : localAmount.toFixed(decimals);
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
