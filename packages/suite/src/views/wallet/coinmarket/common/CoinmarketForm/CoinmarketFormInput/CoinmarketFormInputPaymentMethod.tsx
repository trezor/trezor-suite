import { Control, Controller } from 'react-hook-form';
import { Select } from '@trezor/components';
import {
    CoinmarketPaymentMethodListProps,
    CoinmarketTradeBuySellType,
} from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketBuySellFormProps,
    CoinmarketFormInputDefaultProps,
} from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketFormInputInner,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from 'src/views/wallet/coinmarket';
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import CoinmarketFormInputLoader from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLoader';
import { FORM_PAYMENT_METHOD_SELECT } from 'src/constants/wallet/coinmarket/form';
import { Translation } from 'src/components/suite';

const CoinmarketFormInputPaymentMethod = ({ label }: CoinmarketFormInputDefaultProps) => {
    const {
        control,
        paymentMethods,
        defaultPaymentMethod,
        quotes,
        form: {
            state: { isFormLoading, isFormInvalid },
        },
    } = useCoinmarketFormContext<CoinmarketTradeBuySellType>();

    const getEmptyMethodsLabel = () => {
        if (isFormInvalid || (quotes && quotes.length === 0)) {
            return <Translation id="TR_COINMARKET_NO_METHODS_AVAILABLE" />;
        }

        return '';
    };

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <CoinmarketFormInputInner>
                <Controller
                    name={FORM_PAYMENT_METHOD_SELECT}
                    defaultValue={defaultPaymentMethod}
                    control={control as Control<CoinmarketBuySellFormProps>}
                    render={({ field: { onChange, value } }) => (
                        <Select
                            value={value}
                            onChange={onChange}
                            options={paymentMethods}
                            formatOptionLabel={(option: CoinmarketPaymentMethodListProps) => (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionLabel>
                                        {option.value !== '' ? (
                                            <CoinmarketPaymentPlainType
                                                method={option.value}
                                                methodName={option.label}
                                            />
                                        ) : (
                                            getEmptyMethodsLabel()
                                        )}
                                    </CoinmarketFormOptionLabel>
                                </CoinmarketFormOption>
                            )}
                            data-test="@coinmarket/form/payment-method-select"
                            isClearable={false}
                            isSearchable
                            isDisabled={isFormInvalid}
                        />
                    )}
                />
                {isFormLoading && <CoinmarketFormInputLoader />}
            </CoinmarketFormInputInner>
        </>
    );
};

export default CoinmarketFormInputPaymentMethod;
