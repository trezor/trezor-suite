import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@suite-native/atoms';

import { selectCurrency, setCurrency } from '../slice';
import { currencies } from '../constants';
import { transformFiatCurrencyToSelectItem } from '../utils';
import { CurrencyType } from '../types';

export const CurrencySelector = () => {
    const selectedCurrency = useSelector(selectCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (value: CurrencyType) => {
        dispatch(setCurrency(value));
    };

    const fiatCurrencies = Object.values(currencies).map(transformFiatCurrencyToSelectItem);

    return (
        <Select
            items={fiatCurrencies}
            selectLabel="Currency"
            value={selectedCurrency.label}
            valueLabel={selectedCurrency.label.toUpperCase()}
            onSelectItem={handleSelectCurrency}
        />
    );
};
