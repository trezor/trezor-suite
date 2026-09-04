import { Translation, type TranslationKey } from '@suite/intl';
import { PaymentMethodType } from '@suite/trading';
import type { TradingPaymentMethodType } from '@suite-common/trading';
import { InfoItem, Text } from '@trezor/components';
type TradingPaymentMethodInfoItemProps = {
    paymentMethod: TradingPaymentMethodType;
    paymentMethodName?: string;
    label?: TranslationKey;
};

export const TradingPaymentMethodInfoItem = ({
    paymentMethod,
    paymentMethodName,
    label = 'TR_TRADING_PAYMENT_METHOD',
}: TradingPaymentMethodInfoItemProps) => (
    <InfoItem label={<Translation id={label} />} direction="row">
        <Text typographyStyle="body-sm" as="div">
            <PaymentMethodType method={paymentMethod} methodName={paymentMethodName} />
        </Text>
    </InfoItem>
);
