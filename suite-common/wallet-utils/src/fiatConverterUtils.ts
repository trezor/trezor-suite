import { BigNumber } from '@trezor/utils/src/bigNumber';

export const toFiatCurrency = (amount: string, rate?: number, decimals = 2) => {
    if (!rate) {
        return null;
    }

    let formattedAmount = amount;
    if (typeof amount === 'string') {
        formattedAmount = amount.replace(',', '.');
    }

    const localAmount = new BigNumber(formattedAmount).times(rate);
    if (localAmount.isNaN()) {
        return null;
    }

    return decimals === -1 ? localAmount.toFixed() : localAmount.toFixed(decimals);
};

export const fromFiatCurrency = (localAmount: string, decimals: number, rate?: number) => {
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
