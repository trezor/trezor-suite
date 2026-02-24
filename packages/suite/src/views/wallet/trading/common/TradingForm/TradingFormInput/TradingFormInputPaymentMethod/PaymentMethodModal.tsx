import { useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { PaymentMethodIcon } from '@suite/trading';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    TradingPaymentMethodListProps,
} from '@suite-common/trading';
import { Modal, Row } from '@trezor/components';
import { CardList } from '@trezor/product-components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import { TradingBuySellFormProps } from 'src/types/trading/tradingForm';

interface PaymentMethodModalProps {
    onClose: () => void;
    heading?: TranslationKey;
}

export const PaymentMethodModal = ({ onClose, heading }: PaymentMethodModalProps) => {
    const { paymentMethods, setValue } = useTradingFormContext<TradingTradeBuySellType>();

    const selectPaymentMethod = useCallback(
        (paymentMethod: TradingPaymentMethodListProps) => {
            // setValue is a union type that cannot be called directly, so we need to assert it
            const setValueTyped = setValue as UseFormSetValue<TradingBuySellFormProps>;
            setValueTyped(TRADING_FORM_PAYMENT_METHOD_SELECT, paymentMethod);
            setValueTyped(TRADING_FORM_PROVIDER_SELECT, undefined);
            onClose();
        },
        [setValue, onClose],
    );

    return (
        <Modal
            width={400}
            onCancel={onClose}
            heading={heading ? <Translation id={heading} /> : undefined}
        >
            <CardList>
                {paymentMethods.map(item => (
                    <CardList.Item
                        key={item.value}
                        onClick={() => selectPaymentMethod(item)}
                        data-testid={`@trading/form/payment-method-select/option/${item.value}`}
                    >
                        <Row gap={12} alignItems="center">
                            <PaymentMethodIcon paymentMethod={item.value} />
                            {item.label}
                        </Row>
                    </CardList.Item>
                ))}
            </CardList>
        </Modal>
    );
};
