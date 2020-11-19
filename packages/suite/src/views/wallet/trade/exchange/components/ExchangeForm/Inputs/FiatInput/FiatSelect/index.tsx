import { CleanSelect } from '@trezor/components';
import React from 'react';
import { Controller } from 'react-hook-form';
import { FIAT } from '@suite-config';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';

export const buildCurrencyOptions = () => {
    const result: { value: string; label: string }[] = [];
    FIAT.currencies.forEach(currency =>
        result.push({ value: currency, label: currency.toUpperCase() }),
    );

    return result;
};

const FiatSelect = () => {
    const {
        control,
        setAmountLimits,
        account,
        updateFiatCurrency,
        localCurrencyOption,
    } = useCoinmarketExchangeFormContext();
    const fiatSelect = 'fiatSelect';
    const currencyOptions = buildCurrencyOptions();

    return (
        <Controller
            control={control}
            name={fiatSelect}
            defaultValue={localCurrencyOption}
            render={({ onChange, value }) => {
                return (
                    <CleanSelect
                        onChange={(selected: any) => {
                            onChange(selected);
                            updateFiatCurrency(selected);
                            setAmountLimits(undefined);
                        }}
                        value={value}
                        isClearable={false}
                        options={currencyOptions}
                        isDropdownVisible={account.networkType === 'ethereum'}
                        minWidth="70px"
                    />
                );
            }}
        />
    );
};

export default FiatSelect;
