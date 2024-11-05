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
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import { FORM_PAYMENT_METHOD_SELECT } from 'src/constants/wallet/coinmarket/form';
import { Translation } from 'src/components/suite';

export const CoinmarketFormInputPaymentMethod = ({ label }: CoinmarketFormInputDefaultProps) => {
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
        <Controller
            name={FORM_PAYMENT_METHOD_SELECT}
            defaultValue={defaultPaymentMethod}
            control={control as Control<CoinmarketBuySellFormProps>}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    onChange={onChange}
                    options={paymentMethods}
                    labelLeft={label && <Translation id={label} />}
                    formatOptionLabel={(option: CoinmarketPaymentMethodListProps) =>
                        option.value !== '' && quotes && quotes.length > 0 ? (
                            <CoinmarketPaymentPlainType
                                method={option.value}
                                methodName={option.label}
                            />
                        ) : (
                            getEmptyMethodsLabel()
                        )
                    }
                    data-testid="@coinmarket/form/payment-method-select"
                    isClearable={false}
                    isDisabled={isFormInvalid}
                    isLoading={isFormLoading}
                />
            )}
        />
    );
};
