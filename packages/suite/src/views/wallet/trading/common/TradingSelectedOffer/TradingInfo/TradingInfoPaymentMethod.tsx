import { Translation } from '@suite/intl';
import type { TradingPaymentMethodType } from '@suite-common/trading';
import { InfoItem } from '@trezor/components';

import { TradingPaymentType } from 'src/views/wallet/trading/common/TradingPaymentType';

interface TradingInfoPaymentMethodProps {
    paymentMethod: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export const TradingInfoPaymentMethod = ({
    paymentMethod,
    paymentMethodName,
}: TradingInfoPaymentMethodProps) => (
    <InfoItem label={<Translation id="TR_TRADING_PAYMENT_METHOD" />} direction="row">
        <TradingPaymentType method={paymentMethod} methodName={paymentMethodName} />
    </InfoItem>
);
