import { buildCurrencyOptions } from '@suite-common/wallet-utils';
import { Select } from '@trezor/components';
import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';
import {
    FORM_FIAT_CURRENCY_SELECT,
    FORM_FIAT_INPUT,
    FORM_OUTPUT_CURRENCY,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    isCoinmarketBuyOffers,
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    CoinmarketAllFormProps,
    CoinmarketFormInputCurrencyProps,
} from 'src/types/coinmarket/coinmarketForm';
import { FiatCurrencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import {
    getFiatCurrenciesProps,
    getSelectedCurrency,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOption, CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import styled from 'styled-components';

const SelectWrapper = styled.div`
    /* stylelint-disable selector-class-pattern */
    .react-select__value-container {
        padding: 0;
    }
`;

const CoinmarketFormInputCurrency = ({
    isClean = true,
    size = 'large',
    isDarkLabel = false,
}: CoinmarketFormInputCurrencyProps) => {
    const context = useCoinmarketFormContext();
    const { control, setAmountLimits, defaultCurrency } = context;
    const name = isCoinmarketBuyOffers(context) ? FORM_FIAT_CURRENCY_SELECT : FORM_OUTPUT_CURRENCY;
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
        if (isCoinmarketBuyOffers(context)) {
            context.setValue(
                FORM_FIAT_INPUT,
                fiatCurrencies?.defaultAmountsOfFiatCurrencies?.get(option.value) ?? '',
            );
        }

        if (isCoinmarketExchangeOffers(context) || isCoinmarketSellOffers(context)) {
            context.form.helpers.onFiatCurrencyChange(option.value);
        }
    };

    return (
        <Controller
            name={name}
            defaultValue={defaultCurrency}
            control={control as Control<CoinmarketAllFormProps>}
            render={({ field: { onChange, value } }) => (
                <SelectWrapper>
                    <Select
                        value={value}
                        onChange={(selected: FiatCurrencyOption) => {
                            onChange(selected);
                            setAmountLimits(undefined);

                            onChangeAdditional(selected);
                        }}
                        options={options}
                        formatOptionLabel={option => (
                            <CoinmarketFormOption>
                                <CoinmarketFormOptionLabel $isDark={isDarkLabel}>
                                    {option.label}
                                </CoinmarketFormOptionLabel>
                            </CoinmarketFormOption>
                        )}
                        data-testid="@coinmarket/form/fiat-currency-select"
                        minValueWidth="58px"
                        isClearable={false}
                        isClean={isClean}
                        size={size}
                        isSearchable
                    />
                </SelectWrapper>
            )}
        />
    );
};

export default CoinmarketFormInputCurrency;
