import BigNumber from 'bignumber.js';

const toFiatCurrency = (amount, fiatCurrency, rates) => {
    // calculate amount in local currency
    const rate = rates[fiatCurrency];

    let localAmount = BigNumber(amount).times(rate);
    localAmount = localAmount.isNaN() ? '' : localAmount.toFixed(2);
    return localAmount;
};

const fromFiatCurrency = (localAmount, fiatCurrency, rates, decimals) => {
    const rate = rates[fiatCurrency];

    let amount = BigNumber(localAmount).div(rate);
    amount = amount.isNaN() ? '' : amount.toFixed(decimals);
    return amount;
};

export { toFiatCurrency, fromFiatCurrency };
