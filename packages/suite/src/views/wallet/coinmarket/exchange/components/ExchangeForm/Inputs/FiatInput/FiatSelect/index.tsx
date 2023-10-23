import { Select } from '@trezor/components';
import { Controller } from 'react-hook-form';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { FIAT_CURRENCY } from 'src/types/wallet/coinmarketExchangeForm';
import { buildCurrencyOptions } from '@suite-common/wallet-utils';

const FiatSelect = () => {
    const { control, setAmountLimits, updateFiatCurrency, defaultCurrency } =
        useCoinmarketExchangeFormContext();

    return (
        <Controller
            control={control}
            name={FIAT_CURRENCY}
            defaultValue={defaultCurrency}
            render={({ field: { onChange, value } }) => (
                <Select
                    onChange={(selected: any) => {
                        onChange(selected);
                        updateFiatCurrency(selected);
                        setAmountLimits(undefined);
                    }}
                    data-test="@coinmarket/exchange/fiat-select"
                    value={value}
                    isClearable={false}
                    options={buildCurrencyOptions(value)}
                    minValueWidth="58px"
                    isClean
                />
            )}
        />
    );
};

export default FiatSelect;
