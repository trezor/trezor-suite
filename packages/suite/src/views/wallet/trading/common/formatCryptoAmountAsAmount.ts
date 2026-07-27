export const formatCryptoAmountAsAmount = (
    amount: number,
    baseAmount: number,
    decimals = 8,
): string => {
    let digits = 4;

    if (baseAmount < 1) {
        digits = 6;
    }

    if (baseAmount < 0.01) {
        digits = decimals;
    }

    return amount.toFixed(digits);
};
