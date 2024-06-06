import { Controller } from 'react-hook-form';
import { Select } from '@trezor/components';
import {
    CoinmarketPaymentMethodListProps,
    CoinmarketTradeBuyType,
} from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketFormInput,
    CoinmarketFormInputInner,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from 'src/views/wallet/coinmarket';
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import CoinmarketFormInputLoader from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLoader';

const CoinmarketFormInputPaymentMethod = ({ className, label }: CoinmarketFormInputProps) => {
    const {
        control,
        paymentMethods,
        defaultPaymentMethod,
        form: {
            state: { isFormLoading, isFormInvalid },
        },
    } = useCoinmarketFormContext<CoinmarketTradeBuyType>();

    return (
        <CoinmarketFormInput className={className}>
            <CoinmarketFormInputLabel label={label} />
            <CoinmarketFormInputInner>
                <Controller
                    name="paymentMethod"
                    defaultValue={defaultPaymentMethod}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <Select
                            value={value}
                            onChange={(selected: CoinmarketPaymentMethodListProps) => {
                                onChange(selected);
                            }}
                            options={paymentMethods}
                            formatOptionLabel={(option: CoinmarketPaymentMethodListProps) => {
                                return (
                                    <CoinmarketFormOption>
                                        <CoinmarketFormOptionLabel>
                                            {option.value !== '' ? (
                                                <CoinmarketPaymentPlainType
                                                    method={option.value}
                                                    methodName={option.label}
                                                />
                                            ) : (
                                                <div>{option.label}</div>
                                            )}
                                        </CoinmarketFormOptionLabel>
                                    </CoinmarketFormOption>
                                );
                            }}
                            data-test="@coinmarket/form/payment-method-select"
                            isClearable={false}
                            isSearchable
                            isDisabled={isFormInvalid}
                        />
                    )}
                />
                {isFormLoading && <CoinmarketFormInputLoader />}
            </CoinmarketFormInputInner>
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputPaymentMethod;
