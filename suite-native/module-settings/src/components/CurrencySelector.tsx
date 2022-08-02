import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Select, SelectValue } from '@suite-native/atoms';
import { CurrencyType, fiatCurrenciesMap } from '@suite-common/suite-config';

import { selectCurrency, setCurrency } from '../slice';
import { transformFiatCurrencyToSelectItem } from '../utils';

export const CurrencySelector = () => {
    const selectedCurrency = useSelector(selectCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (value: SelectValue) => {
        dispatch(setCurrency(value as CurrencyType));
    };

    const fiatCurrencies = Object.values(fiatCurrenciesMap).map(transformFiatCurrencyToSelectItem);

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
