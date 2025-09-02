import { useEffect, useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';

import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TradingFiatCurrencyOption,
} from '@suite-common/trading';
import { Select } from '@trezor/components';

import { useTranslation } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingAllFormProps, TradingFormInputCurrencyProps } from 'src/types/trading/tradingForm';
import {
    getFiatCurrenciesProps,
    getSelectedTradingCurrency,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { buildTradingFiatOption } from 'src/utils/wallet/trading/tradingUtils';
import { buildShortCurrencyOption } from 'src/views/wallet/send/Outputs/Amount/BaseCurrencySelect';

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
    const { translationString } = useTranslation();

    const options = useMemo(
        () =>
            currencies
                ? [...currencies]
                      .map(currency => buildTradingFiatOption(currency))
                      .filter(currency => currency.value !== currentCurrency.value)
                : buildShortCurrencyOptions({ translationString, areSatsDisplayed }),
        [currencies, currentCurrency],
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

    // update defaultCurrency in select only on mount
    useEffect(() => {
        if (isTradingBuyContext(context)) {
            context.setValue(TRADING_FORM_FIAT_CURRENCY_SELECT, defaultCurrency);
            context.setValue(
                TRADING_FORM_FIAT_INPUT,
                fiatCurrencies?.defaultAmountsOfFiatCurrencies?.get(defaultCurrency.value) ?? '',
            );
        }
    }, [fiatCurrencies?.defaultAmountsOfFiatCurrencies]); // eslint-disable-line react-hooks/exhaustive-deps

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
