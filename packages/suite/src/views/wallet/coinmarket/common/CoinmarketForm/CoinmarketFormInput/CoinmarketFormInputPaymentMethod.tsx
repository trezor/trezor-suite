import { Controller } from 'react-hook-form';
import {
    CoinmarketFormInput,
    CoinmarketFormInputLabel,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from '../../..';
import { Select } from '@trezor/components';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

const CoinmarketFormInputPaymentMethod = () => {
    const { control, defaultPaymentMethod } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const options = [defaultPaymentMethod];

    return (
        <CoinmarketFormInput>
            <CoinmarketFormInputLabel>Payment method</CoinmarketFormInputLabel>
            <Controller
                name="paymentMethod"
                defaultValue={defaultPaymentMethod}
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
