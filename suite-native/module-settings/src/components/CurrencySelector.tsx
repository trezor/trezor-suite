import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@suite-native/atoms';
import { FiatCurrency, fiatCurrencies, FiatCurrencyCode } from '@suite-common/suite-config';

import { selectFiatCurrency, setFiatCurrency } from '../slice';

export const transformFiatCurrencyToSelectItem = (fiatCurrency: FiatCurrency) => ({
    label: fiatCurrency.value,
    value: fiatCurrency.label,
});

const fiatCurrencyItems = Object.values(fiatCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrency = useSelector(selectFiatCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (value: FiatCurrencyCode) => {
        dispatch(setFiatCurrency(value));
    };

    return (
        <Select<FiatCurrencyCode>
            items={fiatCurrencyItems}
            selectLabel="Currency"
            selectValue={selectedFiatCurrency.label}
            valueLabel={selectedFiatCurrency.label.toUpperCase()}
            onSelectItem={handleSelectCurrency}
        />
    );
};
