export const buildOption = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

export const symbolToInvityApiSymbol = (symbol: string) => {
    if (symbol === 'usdt') {
        return 'usdt20';
    }
    return symbol;
};
