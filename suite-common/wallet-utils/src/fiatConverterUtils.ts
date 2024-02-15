import BigNumber from 'bignumber.js';

import { FiatRatesLegacy } from '@trezor/connect';
import { Rate } from '@suite-common/wallet-types';

export const toFiatCurrency = (
    amount: string,
    fiatCurrency: string,
    fiatRate: FiatRatesLegacy | Rate | undefined,
    decimals = 2,
    legacy = true,
) => {
    // calculate amount in local currency
    const rate = legacy ? (fiatRate as FiatRatesLegacy)?.[fiatCurrency] : fiatRate?.rate;
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

export const fromFiatCurrency = (
    localAmount: string,
    fiatCurrency: string,
    fiatRate: FiatRatesLegacy | Rate | undefined,
    decimals: number,
    legacy = true,
) => {
    const rate = legacy ? (fiatRate as FiatRatesLegacy)?.[fiatCurrency] : fiatRate?.rate;
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
