import { BigNumber } from '@trezor/utils/src/bigNumber';

type ToFiatCurrencyParams = {
    amount: string | BigNumber;
    rate: number | undefined;
};

/**
 * This function SHALL NEVER round or change precision. This is simply just a multiplication of two numbers.
 *
 * Formatting MUST be handled only in formatters in the components, etc... NOT HERE!
 */
export const toFiatCurrency = ({ amount, rate }: ToFiatCurrencyParams) => {
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

    return localAmount;
};

type FromFiatCurrencyParams = {
    localAmount: string;
    rate: number | undefined;
};

/**
 * This function SHALL NEVER round or change precision. This is simply just a division of two numbers.
 *
 * Formatting MUST be handled only in formatters in the components, etc... NOT HERE!
 */
export const fromFiatCurrency = ({ localAmount, rate }: FromFiatCurrencyParams) => {
    if (!rate) {
        return null;
    }

    let formattedLocalAmount = localAmount;
    if (typeof localAmount === 'string') {
        formattedLocalAmount = localAmount.replace(',', '.');
    }

    const amount = new BigNumber(formattedLocalAmount).div(rate);

    return amount.isNaN() ? null : amount;
};
