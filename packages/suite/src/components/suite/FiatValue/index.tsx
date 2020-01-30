import React from 'react';
import { Props } from './Container';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import FormattedNumber from '../FormattedNumber';

/**
 * Returns the value of an crypto assets in fiat currency.
 * If prop `fiatCurrency` is not specified, the currency is read from suite settings.
 * null is returned if there was some problem with conversion (eg. missing rates)
 *
 * @param {Props} { amount, symbol, fiatCurrency, ...props }
 * @returns
 */
const FiatValue = ({ amount, symbol, fiatCurrency, ...props }: Props) => {
    const targetCurrency = fiatCurrency ?? props.settings.localCurrency;
    const fiatRates = props.fiat.find(f => f.symbol === symbol);
    // const fiatRateValue = fiatRates ? fiatRates.rates[targetCurrency] : null;
    const fiat = fiatRates ? toFiatCurrency(amount, targetCurrency, fiatRates) : null;
    if (fiat) {
        return <FormattedNumber currency={targetCurrency} value={fiat} />;
    }
    return null;
};

export default FiatValue;
