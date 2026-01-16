import { Control, Controller } from 'react-hook-form';

import { Translation } from '@suite/intl';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingPaymentMethodListProps,
} from '@suite-common/trading';
import { Select } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import {
    TradingBuySellFormProps,
    TradingFormInputDefaultProps,
} from 'src/types/trading/tradingForm';
import { TradingPaymentPlainType } from 'src/views/wallet/trading/common/TradingPaymentPlainType';

export const TradingFormInputPaymentMethod = ({ label }: TradingFormInputDefaultProps) => {
    const {
        control,
        paymentMethods,
        defaultPaymentMethod,
        quotes,
        form: {
            state: { isFormLoading, isFormInvalid },
        },
        getValues,
        type,
    } = useTradingFormContext<TradingTradeBuySellType>();

    const amountIsEmpty =
        type === 'buy'
            ? !getValues().fiatInput && !getValues().cryptoInput
            : getValues().outputs[0].amount === '';

    const getEmptyMethodsLabel = () => {
        if (isFormInvalid || (quotes && quotes.length === 0)) {
            return <Translation id="TR_TRADING_NO_METHODS_AVAILABLE" />;
        }

        return '';
    };

    return (
        <Controller
            name={TRADING_FORM_PAYMENT_METHOD_SELECT}
            defaultValue={defaultPaymentMethod}
            control={control as Control<TradingBuySellFormProps>}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    onChange={onChange}
                    options={paymentMethods}
                    labelLeft={label && <Translation id={label} />}
                    formatOptionLabel={(option: TradingPaymentMethodListProps) =>
                        option.value !== '' && quotes && quotes.length > 0 ? (
                            <TradingPaymentPlainType
                                method={option.value}
                                methodName={option.label}
                            />
                        ) : (
                            getEmptyMethodsLabel()
                        )
                    }
                    data-testid="@trading/form/payment-method-select"
                    isClearable={false}
                    isDisabled={isFormInvalid}
                    isLoading={isFormLoading && !amountIsEmpty}
                />
            )}
        />
    );
};
