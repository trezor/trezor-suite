import { Row } from '@trezor/components';
import { BuyCryptoPaymentMethod, SellCryptoPaymentMethod } from 'invity-api';
import { Translation } from 'src/components/suite';
import { CoinmarketInfoLeftColumn, CoinmarketInfoRightColumn } from 'src/views/wallet/coinmarket';
import { CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentType';

interface CoinmarketInfoPaymentMethodProps {
    paymentMethod: BuyCryptoPaymentMethod | SellCryptoPaymentMethod;
    paymentMethodName?: string;
}

export const CoinmarketInfoPaymentMethod = ({
    paymentMethod,
    paymentMethodName,
}: CoinmarketInfoPaymentMethodProps) => (
    <Row>
        <CoinmarketInfoLeftColumn>
            <Translation id="TR_COINMARKET_PAYMENT_METHOD" />
        </CoinmarketInfoLeftColumn>
        <CoinmarketInfoRightColumn>
            <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
        </CoinmarketInfoRightColumn>
    </Row>
);
