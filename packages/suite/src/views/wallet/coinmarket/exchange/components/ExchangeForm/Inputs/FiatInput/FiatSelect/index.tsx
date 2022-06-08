import { Select } from '@trezor/components';
import React from 'react';
import { Controller } from 'react-hook-form';
import { FIAT } from '@suite-config';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { FIAT_CURRENCY } from '@wallet-types/coinmarketExchangeForm';

export const buildCurrencyOptions = () => {
    const result: { value: string; label: string }[] = [];
    FIAT.currencies.forEach(currency =>
        result.push({ value: currency, label: currency.toUpperCase() }),
    );

    return result;
};

const FiatSelect = () => {
    const { control, setAmountLimits, updateFiatCurrency, defaultCurrency } =
        useCoinmarketExchangeFormContext();
    const currencyOptions = buildCurrencyOptions();

    return (
        <Controller
            control={control}
            name={FIAT_CURRENCY}
            defaultValue={defaultCurrency}
            render={({ onChange, value }) => (
                <Select
                    onChange={(selected: any) => {
                        onChange(selected);
                        updateFiatCurrency(selected);
                        setAmountLimits(undefined);
                    }}
                    value={value}
                    isClearable={false}
                    options={currencyOptions}
                    minWidth="58px"
                    isClean
                    hideTextCursor
                />
            )}
        />
    );
};

export default FiatSelect;
