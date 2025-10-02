import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';

import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TradingFiatCurrencyOption,
} from '@suite-common/trading';
import { buildCurrencyOptions } from '@suite-common/wallet-utils';
import { Select } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingAllFormProps, TradingFormInputCurrencyProps } from 'src/types/trading/tradingForm';
import {
    getFiatCurrenciesProps,
    getSelectedTradingCurrency,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { buildTradingFiatOption } from 'src/utils/wallet/trading/tradingUtils';

import { useBitcoinAmountUnit } from '../../../../../../hooks/wallet/useBitcoinAmountUnit';

export const TradingFormInputCurrency = ({
    isClean = true,
    width = 100,
}: TradingFormInputCurrencyProps) => {
    const context = useTradingFormContext();
    const { control, setAmountLimits, defaultCurrency } = context;
    const name = isTradingBuyContext(context)
        ? TRADING_FORM_FIAT_CURRENCY_SELECT
        : TRADING_FORM_OUTPUT_CURRENCY;
    const currentCurrency = getSelectedTradingCurrency(context);
    const fiatCurrencies = getFiatCurrenciesProps(context);
    const currencies = fiatCurrencies?.supportedFiatCurrencies ?? null;
    const { areSatsDisplayed } = useBitcoinAmountUnit(context.network.symbol);

    const options = useMemo(
        () =>
            currencies
                ? [...currencies]
                      .map(currency => buildTradingFiatOption(currency))
                      .filter(currency => currency.value !== currentCurrency.value)
                : buildCurrencyOptions({ selected: currentCurrency, areSatsDisplayed }),
        [currencies, currentCurrency, areSatsDisplayed],
    );

    const onChangeAdditional = (option: TradingFiatCurrencyOption) => {
        if (isTradingBuyContext(context)) {
            context.setValue(
                TRADING_FORM_FIAT_INPUT,
                fiatCurrencies?.defaultAmountsOfFiatCurrencies?.get(option.value) ?? '',
            );
        }

        if (isTradingExchangeContext(context) || isTradingSellContext(context)) {
            context.form.helpers.onFiatCurrencyChange(option.value);
        }

        if (isTradingExchangeContext(context)) {
            context.resetSelectedOffer();
            context.refreshQuotes();
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
                    onChange={(selected: TradingFiatCurrencyOption) => {
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
