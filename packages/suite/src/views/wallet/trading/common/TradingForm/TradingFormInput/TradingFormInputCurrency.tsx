import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';

import { buildCurrencyOptions } from '@suite-common/wallet-utils';
import { Select } from '@trezor/components';

import {
    FORM_FIAT_CURRENCY_SELECT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_CURRENCY,
} from 'src/constants/wallet/trading/form';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingAllFormProps, TradingFormInputCurrencyProps } from 'src/types/trading/tradingForm';
import { FiatCurrencyOption } from 'src/types/wallet/tradingCommonTypes';
import {
    getFiatCurrenciesProps,
    getSelectedCurrency,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { buildFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const TradingFormInputCurrency = ({
    isClean = true,
    width = 100,
}: TradingFormInputCurrencyProps) => {
    const context = useTradingFormContext();
    const { control, setAmountLimits, defaultCurrency } = context;
    const name = isTradingBuyContext(context) ? FORM_FIAT_CURRENCY_SELECT : FORM_OUTPUT_CURRENCY;
    const currentCurrency = getSelectedCurrency(context);
    const fiatCurrencies = getFiatCurrenciesProps(context);
    const currencies = fiatCurrencies?.supportedFiatCurrencies ?? null;
    const options = useMemo(
        () =>
            currencies
                ? [...currencies]
                      .map(currency => buildFiatOption(currency))
                      .filter(currency => currency.value !== currentCurrency.value)
                : buildCurrencyOptions(currentCurrency),
        [currencies, currentCurrency],
    );

    const onChangeAdditional = (option: FiatCurrencyOption) => {
        if (isTradingBuyContext(context)) {
            context.setValue(
                FORM_FIAT_INPUT,
                fiatCurrencies?.defaultAmountsOfFiatCurrencies?.get(option.value) ?? '',
            );
        }

        if (isTradingExchangeContext(context) || isTradingSellContext(context)) {
            context.form.helpers.onFiatCurrencyChange(option.value);
        }
    };

    return (
        <Controller
            name={name}
            defaultValue={defaultCurrency}
            control={control as Control<TradingAllFormProps>}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    onChange={(selected: FiatCurrencyOption) => {
                        onChange(selected);
                        setAmountLimits(undefined);

                        onChangeAdditional(selected);
                    }}
                    options={options}
                    data-testid="@trading/form/fiat-currency-select"
                    isClearable={false}
                    isClean={isClean}
                    size="small"
                    isSearchable
                    width={width}
                />
            )}
        />
    );
};
