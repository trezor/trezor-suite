import { Translation } from '@suite/intl';
import { PaymentMethodType } from '@suite/trading';
import type { TradingPaymentMethodType } from '@suite-common/trading';
import { InfoItem, Text } from '@trezor/components';
type TradingPaymentMethodInfoItemProps = {
    paymentMethod: TradingPaymentMethodType;
    paymentMethodName?: string;
};

export const TradingPaymentMethodInfoItem = ({
    paymentMethod,
    paymentMethodName,
}: TradingPaymentMethodInfoItemProps) => (
    <InfoItem label={<Translation id="TR_TRADING_PAYMENT_METHOD" />} direction="row">
        <Text typographyStyle="body-sm" as="div">
            <PaymentMethodType method={paymentMethod} methodName={paymentMethodName} />
        </Text>
    </InfoItem>
);
