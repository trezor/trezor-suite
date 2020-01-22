import React from 'react';
import { Props } from './Container';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import FormattedNumber from '../FormattedNumber';

const FiatAmount = ({ amount, symbol, fiatCurrency, ...props }: Props) => {
    const targetCurrency = fiatCurrency ?? props.settings.localCurrency;
    const fiatRates = props.fiat.find(f => f.symbol === symbol);
    // const fiatRateValue = fiatRates ? fiatRates.rates[targetCurrency] : null;
    const fiat = fiatRates ? toFiatCurrency(amount, targetCurrency, fiatRates) : null;
    if (fiat) {
        return <FormattedNumber currency={targetCurrency} value={fiat} />;
    }
    return 'N/A';
};

export default FiatAmount;
