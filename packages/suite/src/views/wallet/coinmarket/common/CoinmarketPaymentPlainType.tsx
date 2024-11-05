import { Text } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { FORM_DEFAULT_PAYMENT_METHOD } from 'src/constants/wallet/coinmarket/form';
import { CoinmarketPaymentMethodType } from 'src/types/coinmarket/coinmarket';

interface CoinmarketPaymentTypeProps {
    method?: CoinmarketPaymentMethodType;
    methodName?: string;
}
type TranslatedPaymentMethod = 'bankTransfer' | 'creditCard';

type PaymentMethodId = `TR_PAYMENT_METHOD_${Uppercase<TranslatedPaymentMethod>}`;

const getPaymentMethod = (method: TranslatedPaymentMethod): PaymentMethodId =>
    `TR_PAYMENT_METHOD_${method.toUpperCase() as Uppercase<TranslatedPaymentMethod>}`;

export const CoinmarketPaymentPlainType = ({ method, methodName }: CoinmarketPaymentTypeProps) => (
    <Text data-testid="@coinmarket/form/info/payment-method" as="div">
        {method ? (
            <>
                {method === 'bankTransfer' || method === FORM_DEFAULT_PAYMENT_METHOD ? (
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
