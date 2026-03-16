import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type AmountUnit, asAmountUnit } from './AmountTypes';

type ToFiatCurrencyParams = {
    // Todo: remove `string`, its used only for backwards compatibility
    amount: string | AmountUnit;
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

type FromBaseCurrencyParams = {
    // Todo: remove string
    fiatAmount: string | BaseCurrencyAmount;
    rate: number | undefined;
};

/**
 * This function does only numerical operations, formatting is to be handled in formatters.
 */
export const fromBaseCurrencyToCryptoUnit = ({
    fiatAmount,
    rate,
}: FromBaseCurrencyParams): AmountUnit | null => {
    if (!rate) {
        return null;
    }

    let formattedLocalAmount = fiatAmount;
    if (typeof fiatAmount === 'string') {
        formattedLocalAmount = fiatAmount.replace(',', '.');
    }

    const amount = new BigNumber(formattedLocalAmount).div(rate);

    return amount.isNaN() ? null : asAmountUnit(amount);
};
