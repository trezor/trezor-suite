import BigNumber from 'bignumber.js';

const toFiatCurrency = (amount, fiatCurrency, networkRates) => {
    // calculate amount in local currency
    if (!networkRates || !networkRates.rates) {
        return '';
    }

    const rate = networkRates.rates[fiatCurrency];
    if (!rate) {
        return '';
    }

    let localAmount = BigNumber(amount).times(rate);
    localAmount = localAmount.isNaN() ? '' : localAmount.toFixed(2);
    return localAmount;
};

const fromFiatCurrency = (localAmount, fiatCurrency, networkRates, decimals) => {
    if (!networkRates || !networkRates.rates) {
        return '';
    }

    const rate = networkRates.rates[fiatCurrency];
    if (!rate) {
        return '';
    }

    let amount = BigNumber(localAmount).div(rate);
    amount = amount.isNaN() ? '' : amount.toFixed(decimals);
    return amount;
};

export { toFiatCurrency, fromFiatCurrency };
