import { Select } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { FORM_FIAT_CURRENCY_SELECT, FORM_FIAT_INPUT } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { FiatCurrencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getFiatCurrenciesProps } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOption, CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import styled from 'styled-components';

const SelectWrapper = styled(Select)`
    .react-select__value-container {
        padding: 0;
    }
`;

interface CoinmarketFormInputCurrencyProps {
    className?: string;
    isClean?: boolean;
    size?: 'small' | 'large';
    isDarkLabel?: boolean;
}

const CoinmarketFormInputCurrency = ({
    className,
    isClean = true,
    size = 'large',
    isDarkLabel = false,
}: CoinmarketFormInputCurrencyProps) => {
    const context = useCoinmarketFormContext();
    const { defaultCurrency, control, setAmountLimits, setValue } = context;

    const fiatCurrencies = getFiatCurrenciesProps(context);
    const currencies = fiatCurrencies?.supportedFiatCurrencies ?? [];

    return (
        <Controller
            name={FORM_FIAT_CURRENCY_SELECT}
            defaultValue={defaultCurrency}
            control={control}
            render={({ field: { onChange, value } }) => (
                <SelectWrapper
                    value={value}
                    onChange={(selected: FiatCurrencyOption) => {
                        onChange(selected);
                        setAmountLimits(undefined);
                        setValue(
                            FORM_FIAT_INPUT,
                            fiatCurrencies?.defaultAmountsOfFiatCurrencies?.get(selected.value) ??
                                '',
                        );
                    }}
                    options={[...currencies].map(currency => buildFiatOption(currency)) ?? []}
                    formatOptionLabel={option => {
                        return (
                            <CoinmarketFormOption>
                                <CoinmarketFormOptionLabel $isDark={isDarkLabel}>
                                    {option.label}
                                </CoinmarketFormOptionLabel>
                            </CoinmarketFormOption>
                        );
                    }}
                    className={className}
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
