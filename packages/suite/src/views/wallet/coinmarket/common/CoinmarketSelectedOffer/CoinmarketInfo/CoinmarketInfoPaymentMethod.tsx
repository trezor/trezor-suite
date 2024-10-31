import { InfoRow } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CoinmarketPaymentMethodType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentType';

interface CoinmarketInfoPaymentMethodProps {
    paymentMethod: CoinmarketPaymentMethodType;
    paymentMethodName?: string;
}

export const CoinmarketInfoPaymentMethod = ({
    paymentMethod,
    paymentMethodName,
}: CoinmarketInfoPaymentMethodProps) => (
    <InfoRow label={<Translation id="TR_COINMARKET_PAYMENT_METHOD" />} direction="row">
        <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
    </InfoRow>
);
