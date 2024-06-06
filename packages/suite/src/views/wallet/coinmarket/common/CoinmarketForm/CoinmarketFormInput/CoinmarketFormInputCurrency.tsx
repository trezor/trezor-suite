import { fiatCurrencies } from '@suite-common/suite-config';
import { Select } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { FiatCurrencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOption, CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';

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
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';

    const { defaultCurrency, control, buyInfo, setAmountLimits, setValue } =
        useCoinmarketFormContext<CoinmarketTradeBuyType>();

    return (
        <Controller
            name={currencySelect}
            defaultValue={defaultCurrency}
            control={control}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    onChange={(selected: FiatCurrencyOption) => {
                        onChange(selected);
                        setAmountLimits(undefined);
                        setValue(
                            fiatInput,
                            buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(selected.value),
                        );
                    }}
                    options={Object.keys(fiatCurrencies)
                        .filter(c => buyInfo?.supportedFiatCurrencies.has(c))
                        .map((currency: string) => buildFiatOption(currency))}
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
