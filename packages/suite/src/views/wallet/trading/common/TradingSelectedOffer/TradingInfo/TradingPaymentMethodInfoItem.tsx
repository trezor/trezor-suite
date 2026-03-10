import { Translation } from '@suite/intl';
import type { TradingPaymentMethodType } from '@suite-common/trading';
import { InfoItem, Text } from '@trezor/components';

import { TradingPaymentType } from 'src/views/wallet/trading/common/TradingPaymentType';

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
            <TradingPaymentType method={paymentMethod} methodName={paymentMethodName} />
        </Text>
    </InfoItem>
);
