import {
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingPaymentMethodType,
} from '@suite-common/trading';
import { Text } from '@trezor/components';

import { Translation } from 'src/components/suite';

interface TradingPaymentTypeProps {
    method?: TradingPaymentMethodType;
    methodName?: string;
}
type TranslatedPaymentMethod = 'bankTransfer' | 'creditCard';

type PaymentMethodId = `TR_PAYMENT_METHOD_${Uppercase<TranslatedPaymentMethod>}`;

const getPaymentMethod = (method: TranslatedPaymentMethod): PaymentMethodId =>
    `TR_PAYMENT_METHOD_${method.toUpperCase() as Uppercase<TranslatedPaymentMethod>}`;

export const TradingPaymentPlainType = ({ method, methodName }: TradingPaymentTypeProps) => (
    <Text data-testid="@trading/form/info/payment-method" as="div">
        {method ? (
            <>
                {method === 'bankTransfer' || method === TRADING_DEFAULT_PAYMENT_METHOD ? (
                    <Translation id={getPaymentMethod(method)} />
                ) : (
                    methodName || method
                )}
            </>
        ) : (
            <Translation id="TR_PAYMENT_METHOD_UNKNOWN" />
        )}
    </Text>
);
