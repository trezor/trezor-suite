import BigNumber from 'bignumber.js';
import { Fiat } from '@wallet-types';

const toFiatCurrency = (amount: string, fiatCurrency: string, networkRates: Fiat) => {
    // calculate amount in local currency
    if (!networkRates || !networkRates.rates || !amount) {
        return null;
    }

    const rate = networkRates.rates[fiatCurrency];
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
    networkRates: Fiat,
    decimals: number,
) => {
    if (!networkRates || !networkRates.rates || !localAmount) {
        return '';
    }

    const rate = networkRates.rates[fiatCurrency];
    if (!rate) {
        return '';
    }

    let formattedLocalAmount = localAmount;
    if (typeof localAmount === 'string') {
        formattedLocalAmount = localAmount.replace(',', '.');
    }

    const amount = new BigNumber(formattedLocalAmount).div(rate);
    const amountStr = amount.isNaN() ? '' : amount.toFixed(decimals);
    return amountStr;
};

export { toFiatCurrency, fromFiatCurrency };
