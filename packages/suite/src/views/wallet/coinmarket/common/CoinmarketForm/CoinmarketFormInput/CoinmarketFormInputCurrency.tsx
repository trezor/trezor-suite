import { buildCurrencyOptions } from '@suite-common/wallet-utils';
import { Select } from '@trezor/components';
import { Control, Controller } from 'react-hook-form';
import { FORM_FIAT_CURRENCY_SELECT, FORM_FIAT_INPUT } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketBuyOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    CoinmarketAllFormProps,
    CoinmarketFormInputCurrencyProps,
} from 'src/types/coinmarket/coinmarketForm';
import { FiatCurrencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getFiatCurrenciesProps } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOption, CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import styled from 'styled-components';

const SelectWrapper = styled(Select)`
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
    const { defaultCurrency, control, setAmountLimits } = context;

    const fiatCurrencies = getFiatCurrenciesProps(context);
    const currencies = fiatCurrencies?.supportedFiatCurrencies ?? null;
    const options = currencies
        ? [...currencies].map(currency => buildFiatOption(currency))
        : buildCurrencyOptions(defaultCurrency);

    const setBuyDefaultFiatAmount = (option: FiatCurrencyOption) => {
        if (isCoinmarketBuyOffers(context)) {
            context.setValue(
                FORM_FIAT_INPUT,
                fiatCurrencies?.defaultAmountsOfFiatCurrencies?.get(option.value) ?? '',
            );
        }
    };

    return (
        <Controller
            name={FORM_FIAT_CURRENCY_SELECT}
            defaultValue={defaultCurrency}
            control={control as Control<CoinmarketAllFormProps>}
            render={({ field: { onChange, value } }) => (
                <SelectWrapper
                    value={value}
                    onChange={(selected: FiatCurrencyOption) => {
                        onChange(selected);
                        setAmountLimits(undefined);

                        setBuyDefaultFiatAmount(selected);
                    }}
                    options={options}
                    formatOptionLabel={option => (
                        <CoinmarketFormOption>
                            <CoinmarketFormOptionLabel $isDark={isDarkLabel}>
                                {option.label}
                            </CoinmarketFormOptionLabel>
                        </CoinmarketFormOption>
                    )}
                    data-test="@coinmarket/form/fiat-currency-select"
                    minValueWidth="58px"
                    isClearable={false}
                    isClean={isClean}
                    size={size}
                    isSearchable
                />
            )}
        />
    );
};

export default CoinmarketFormInputCurrency;
