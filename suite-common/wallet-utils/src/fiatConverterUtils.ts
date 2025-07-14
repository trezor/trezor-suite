import { NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { AmountUnit } from './AmountTypes';
import { BaseCurrencyAmount, asBaseCurrencyAmount } from './baseCurrency';

type ToFiatCurrencyParams = {
    // Todo: remove `string`, its used only for backwards compatibility
    amount: string | AmountUnit<NetworkSymbol>;
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
    fiatAmount: string;
    rate: number | undefined;
};

/**
 * This function does only numerical operations, formatting is to be handled in formatters.
 */
export const fromBaseCurrency = ({
    fiatAmount,
    rate,
}: FromBaseCurrencyParams): BigNumber | null => {
    if (!rate) {
        return null;
    }

    let formattedLocalAmount = fiatAmount;
    if (typeof fiatAmount === 'string') {
        formattedLocalAmount = fiatAmount.replace(',', '.');
    }

    const amount = new BigNumber(formattedLocalAmount).div(rate);

    return amount.isNaN() ? null : amount;
};
