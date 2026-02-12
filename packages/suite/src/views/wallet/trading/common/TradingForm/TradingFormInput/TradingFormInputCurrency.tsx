import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';

import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TradingFiatCurrencyOption,
} from '@suite-common/trading';
import { buildCurrencyOptions, buildCurrencyShortOption } from '@suite-common/wallet-utils';
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

    const options = useMemo(
        () =>
            currencies
                ? [...currencies].map(currency => buildTradingFiatOption(currency))
                : buildCurrencyOptions({ selected: currentCurrency, areSatsDisplayed }),
        [currencies, currentCurrency, areSatsDisplayed],
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
                <Select
                    value={buildCurrencyShortOption({
                        currency: value.value,
                        areSatsDisplayed: false,
                    })}
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
            )}
        />
    );
};
