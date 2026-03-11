import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';

import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TradingFiatCurrencyOption,
    buildTradingFiatOption,
    isSupportedFiatCurrency,
} from '@suite-common/trading';
import { buildCurrencyOptions, buildCurrencyShortOption } from '@suite-common/wallet-utils';
import { isBaseCurrencyCode } from '@trezor/blockchain-link-types';
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

import { useBitcoinAmountUnit } from '../../../../../../hooks/wallet/useBitcoinAmountUnit';

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
    const { areSatsDisplayed } = useBitcoinAmountUnit(context.network.symbol);
    const selectedBaseCurrency = buildCurrencyShortOption({
        currency: isBaseCurrencyCode(currentCurrency.value) ? currentCurrency.value : '',
        areSatsDisplayed,
    });

    const options = useMemo(
        () =>
            currencies
                ? [...currencies].map(currency => buildTradingFiatOption(currency))
                : buildCurrencyOptions({ selected: selectedBaseCurrency, areSatsDisplayed }),
        [currencies, selectedBaseCurrency, areSatsDisplayed],
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
            render={({ field: { onChange, value } }) => {
                const selectedCurrencyCode =
                    typeof value === 'object' && value !== null && 'value' in value
                        ? value.value
                        : value;

                return (
                    <Select
                        value={
                            selectedCurrencyCode && isSupportedFiatCurrency(selectedCurrencyCode)
                                ? buildTradingFiatOption(selectedCurrencyCode)
                                : defaultCurrency
                        }
                        onChange={(selected: TradingFiatCurrencyOption) => {
                            onChange(selected);
                            setAmountLimits(undefined);

                            onChangeAdditional(selected);
                        }}
                        options={options}
                        data-testid="@trading/form/fiat-currency-select"
                        isClearable={false}
                        size="small"
                        isSearchable
                        width={width}
                        isClean={isClean}
                    />
                );
            }}
        />
    );
};
