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
 * The function will called (and rendered) with 1 object param: {fiatValue, fiatRateValue, fiatRateTimestamp}.
 *
 *  In case of custom source of fiat rates returned timestamp is null;
 * @param {Props} { amount, symbol, fiatCurrency, ...props }
 * @returns
 */

const FiatValue = ({ amount, symbol, fiatCurrency, source, useCustomSource, ...props }: Props) => {
    const targetCurrency = fiatCurrency ?? props.settings.localCurrency;
    const currentFiatRates = props.fiat.find(f => f.symbol === symbol)?.current;
    const ratesSource = useCustomSource ? source : currentFiatRates?.rates;
    const fiat = ratesSource ? toFiatCurrency(amount, targetCurrency, ratesSource) : null;
    if (fiat) {
        const fiatValueComponent = <FormattedNumber currency={targetCurrency} value={fiat} />;
        const fiatRateValue = ratesSource?.[targetCurrency] ?? null;
        const fiatRateComponent = fiatRateValue ? (
            <FormattedNumber currency={targetCurrency} value={fiatRateValue} />
        ) : null;
        if (!props.children) return fiatValueComponent;
        return props.children({
            value: fiatValueComponent,
            rate: fiatRateComponent,
            timestamp: useCustomSource ? null : currentFiatRates?.ts ?? null,
        });
    }
    if (!props.children) return null;
    return props.children({ value: null, rate: null, timestamp: null });
};

export default FiatValue;
