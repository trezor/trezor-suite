import React from 'react';
import { Props } from './Container';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import FormattedNumber from '../FormattedNumber';

/**
 * If used without children prop it returns a value of an crypto assets in fiat currency.
 * If prop `fiatCurrency` is not specified, the currency is read from suite settings.
 * null is returned if there was some problem with conversion (eg. missing rates)
 *
 * Advanced usage is with passing a function as a children prop.
 * The function will called (and rendered) with 3 params: fiatValue, fiatRateValue, fiatRateTimestamp.
 *
 * @param {Props} { amount, symbol, fiatCurrency, ...props }
 * @returns
 */
const FiatValue = ({ amount, symbol, fiatCurrency, ...props }: Props) => {
    const targetCurrency = fiatCurrency ?? props.settings.localCurrency;
    const fiatRates = props.fiat.find(f => f.symbol === symbol);

    const fiatRateValue = fiatRates ? fiatRates.rates[targetCurrency] : null;
    const fiat = fiatRates ? toFiatCurrency(amount, targetCurrency, fiatRates) : null;
    if (fiat) {
        const fiatValue = <FormattedNumber currency={targetCurrency} value={fiat} />;
        if (!props.children) return fiatValue;
        return props.children(fiatValue, fiatRateValue, fiatRates!.timestamp);
    }
    if (!props.children) return null;
    return props.children(null, null, null);
};

export default FiatValue;
