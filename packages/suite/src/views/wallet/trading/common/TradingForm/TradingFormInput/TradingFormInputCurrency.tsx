import { useMemo } from 'react';
import { type Control, Controller } from 'react-hook-form';

import {
    CurrencyPicker,
    mapCurrenciesToCurrencyPickerOptions,
    mapCurrencyToCurrencyPickerOption,
} from '@suite/trading';
import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    type TradingFiatCurrencyOption,
    buildTradingFiatOption,
    isTradingFiatCurrencyOption,
} from '@suite-common/trading';
import { buildCurrencyOptions, buildCurrencyShortOption } from '@suite-common/wallet-utils';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputCurrencyProps,
} from 'src/types/trading/tradingForm';
import {
    getFiatCurrenciesProps,
    getSelectedTradingCurrency,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

export const TradingFormInputCurrency = ({
    width,
    isClean = false,
}: TradingFormInputCurrencyProps) => {
    const context = useTradingFormContext();
    const { control, setAmountLimits, defaultCurrency } = context;
    const name = isTradingBuyContext(context)
        ? TRADING_FORM_FIAT_CURRENCY_SELECT
        : TRADING_FORM_OUTPUT_CURRENCY;
    const currentCurrency = getSelectedTradingCurrency(context);
    const fiatCurrencies = getFiatCurrenciesProps(context);
    const currencies = fiatCurrencies?.supportedFiatCurrencies ?? null;
    const selectedBaseCurrencyValue = isFiatBaseCurrencyCode(currentCurrency.value)
        ? currentCurrency.value
        : '';

    const selectedBaseCurrency = buildCurrencyShortOption({
        currency: selectedBaseCurrencyValue,
        areSatsDisplayed: false,
    });

    const options = useMemo(
        () =>
            currencies
                ? [...currencies].map(currency => buildTradingFiatOption(currency))
                : buildCurrencyOptions({
                      selected: selectedBaseCurrency,
                      areSatsDisplayed: false,
                  }).filter(option => isFiatBaseCurrencyCode(option.value)),
        [currencies, selectedBaseCurrency],
    );

    const onChangeAdditional = (option: TradingFiatCurrencyOption) => {
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
                <CurrencyPicker
                    options={mapCurrenciesToCurrencyPickerOptions(options)}
                    onSelect={option => {
                        onChange(option);
                        setAmountLimits(undefined);
                        if (isTradingFiatCurrencyOption(option)) {
                            onChangeAdditional(option);
                        }
                    }}
                    value={mapCurrencyToCurrencyPickerOption(value)}
                    width={width}
                    isClean={isClean}
                />
            )}
        />
    );
};
