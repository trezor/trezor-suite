import { Select } from '@trezor/components';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { FIAT_CURRENCY } from '@wallet-types/coinmarketExchangeForm';
import { buildCurrencyOptions } from '@suite-common/wallet-utils';

const FiatSelect = () => {
    const { control, setAmountLimits, updateFiatCurrency, defaultCurrency } =
        useCoinmarketExchangeFormContext();

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
                    data-test="@coinmarket/exchange/fiat-select"
                    value={value}
                    isClearable={false}
                    options={buildCurrencyOptions(value)}
                    minWidth="58px"
                    isClean
                    hideTextCursor
                />
            )}
        />
    );
};

export default FiatSelect;
