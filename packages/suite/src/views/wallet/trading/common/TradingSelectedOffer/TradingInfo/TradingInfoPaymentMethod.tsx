import type { TradingPaymentMethodType } from '@suite-common/invity';
import { InfoItem } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentType';

interface CoinmarketInfoPaymentMethodProps {
    paymentMethod: TradingPaymentMethodType;
    paymentMethodName?: string;
}

export const CoinmarketInfoPaymentMethod = ({
    paymentMethod,
    paymentMethodName,
}: CoinmarketInfoPaymentMethodProps) => (
    <InfoItem label={<Translation id="TR_COINMARKET_PAYMENT_METHOD" />} direction="row">
        <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
    </InfoItem>
);
