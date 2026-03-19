import { type TradingPaymentMethodType } from '@suite-common/trading';
import { Row } from '@trezor/components';

import { PaymentMethodIcon } from './PaymentMethodIcon';
import { PaymentMethodPlainType } from './PaymentMethodPlainType';

interface PaymentMethodTypeProps {
    method?: TradingPaymentMethodType;
    methodName?: string;
}

export const PaymentMethodType = ({ method, methodName }: PaymentMethodTypeProps) => (
    <Row gap={8}>
        {method && <PaymentMethodIcon paymentMethod={method} />}
        <PaymentMethodPlainType method={method} methodName={methodName} />
    </Row>
);
