import { BigNumber } from '@trezor/utils/src/bigNumber';

import { BaseCurrencyAmount, asBaseCurrencyAmount } from './baseCurrency';

type ToFiatCurrencyParams = {
    amount: string | BigNumber;
    rate: number | undefined;
};

/**
 * This function does only numerical operations, formatting is to be handled in formatters.
 */
export const toFiatCurrency = ({
    amount,
    rate,
}: ToFiatCurrencyParams): BaseCurrencyAmount | null => {
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

    return asBaseCurrencyAmount(localAmount);
};

type FromFiatCurrencyParams = {
    localAmount: string;
    rate: number | undefined;
};

/**
 * This function does only numerical operations, formatting is to be handled in formatters.
 */
export const fromFiatCurrency = ({
    localAmount,
    rate,
}: FromFiatCurrencyParams): BigNumber | null => {
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
