import BigNumber from 'bignumber.js';
import { CoinFiatRates } from '@wallet-types';

const toFiatCurrency = (
    amount: string,
    fiatCurrency: string,
    networkRates: NonNullable<CoinFiatRates['current']>['rates'] | undefined,
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
    const localAmountStr = localAmount.isNaN() ? null : localAmount.toFixed(2);
    return localAmountStr;
};

const fromFiatCurrency = (
    localAmount: string,
    fiatCurrency: string,
    networkRates: NonNullable<CoinFiatRates['current']>['rates'] | undefined,
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

export { toFiatCurrency, fromFiatCurrency };
