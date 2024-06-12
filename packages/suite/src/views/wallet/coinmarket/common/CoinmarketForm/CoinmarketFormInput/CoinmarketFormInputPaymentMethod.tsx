import { Controller } from 'react-hook-form';
import {
    CoinmarketFormInput,
    CoinmarketFormInputInner,
    CoinmarketFormInputLabel,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from '../../..';
import { Select } from '@trezor/components';
import {
    CoinmarketPaymentMethodListProps,
    CoinmarketTradeBuyType,
} from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketPaymentPlainType } from '../../CoinmarketPaymentPlainType';
import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Translation } from 'src/components/suite';
import CoinmarketFormInputLoader from './CoinmarketFormInputLoader';

interface CoinmarketFormInputPaymentMethodProps {
    className?: string;
    label?: ExtendedMessageDescriptor['id'];
}

const CoinmarketFormInputPaymentMethod = ({
    className,
    label,
}: CoinmarketFormInputPaymentMethodProps) => {
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
            {label && (
                <CoinmarketFormInputLabel>
                    <Translation id={label} />
                </CoinmarketFormInputLabel>
            )}
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
