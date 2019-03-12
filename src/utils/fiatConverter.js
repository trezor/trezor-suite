import BigNumber from 'bignumber.js';

const toFiatCurrency = (amount, fiatCurrency, networkRates) => {
    // calculate amount in local currency
    if (!networkRates || !networkRates.rates || !amount) {
        return '';
    }

    const rate = networkRates.rates[fiatCurrency];
    if (!rate) {
        return '';
    }

    const formattedAmount = amount.replace(',', '.');

    let localAmount = BigNumber(formattedAmount).times(rate);
    localAmount = localAmount.isNaN() ? '' : localAmount.toFixed(2);
    return localAmount;
};

const fromFiatCurrency = (localAmount, fiatCurrency, networkRates, decimals) => {
    if (!networkRates || !networkRates.rates || !localAmount) {
        return '';
    }

    const rate = networkRates.rates[fiatCurrency];
    if (!rate) {
        return '';
    }

    const formattedLocalAmount = localAmount.replace(',', '.');

    let amount = BigNumber(formattedLocalAmount).div(rate);
    amount = amount.isNaN() ? '' : amount.toFixed(decimals);
    return amount;
};

export { toFiatCurrency, fromFiatCurrency };
