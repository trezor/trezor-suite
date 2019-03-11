const toFiatCurrency = (amount, fiatCurrency, rates) => {
    // calculate amount in local currency
    const rate = rates[fiatCurrency];

    let localAmount = parseFloat(amount) * rate;
    localAmount = Number.isNaN(localAmount) ? '' : localAmount.toFixed(2);
    return localAmount;
};

const fromFiatCurrency = (localAmount, fiatCurrency, rates, decimals) => {
    const rate = rates[fiatCurrency];

    let amount = parseFloat(localAmount) / rate;
    amount = Number.isNaN(amount) ? '' : amount.toFixed(decimals);
    return amount;
};

export { toFiatCurrency, fromFiatCurrency };
