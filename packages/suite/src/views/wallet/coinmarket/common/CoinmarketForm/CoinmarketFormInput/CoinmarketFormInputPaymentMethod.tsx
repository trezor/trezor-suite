import { Controller } from 'react-hook-form';
import {
    CoinmarketFormInput,
    CoinmarketFormInputLabel,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from '../../..';
import { Select } from '@trezor/components';
import { useCoinmarketBuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';

const CoinmarketFormInputPaymentMethod = () => {
    const { control } = useCoinmarketBuyFormContext();
    const options = [
        {
            value: 'All payment methods',
            label: 'All payment methods',
        },
    ];

    return (
        <CoinmarketFormInput>
            <CoinmarketFormInputLabel>Payment method</CoinmarketFormInputLabel>
            <Controller
                name="paymentMethod"
                defaultValue={options[0]}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        onChange={(selected: any) => {
                            onChange(selected);
                        }}
                        options={options}
                        formatOptionLabel={option => {
                            return (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionLabel>
                                        {option.label}
                                    </CoinmarketFormOptionLabel>
                                </CoinmarketFormOption>
                            );
                        }}
                        data-test="@coinmarket/form/fiat-payment-method-select"
                        isClearable={false}
                        isSearchable
                        isDisabled
                    />
                )}
            />
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputPaymentMethod;
