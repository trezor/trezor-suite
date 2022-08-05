import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Select, SelectItemType, SelectValue } from '@suite-native/atoms';
import { FiatCurrency, FiatCurrencyCode, fiatCurrencies } from '@suite-common/suite-config';

import { selectFiatCurrency, setFiatCurrency } from '../slice';

export const transformFiatCurrencyToSelectItem = (fiatCurrency: FiatCurrency): SelectItemType => ({
    label: fiatCurrency.value,
    value: fiatCurrency.label,
});

const fiatCurrencyItems = Object.values(fiatCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrency = useSelector(selectFiatCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (value: SelectValue) => {
        dispatch(setFiatCurrency(value as FiatCurrencyCode));
    };

    return (
        <Select
            items={fiatCurrencyItems}
            selectLabel="Currency"
            value={selectedFiatCurrency.label}
            valueLabel={selectedFiatCurrency.label.toUpperCase()}
            onSelectItem={handleSelectCurrency}
        />
    );
};
