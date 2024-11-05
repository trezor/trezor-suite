import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import { CoinmarketPaymentMethodType } from 'src/types/coinmarket/coinmarket';

interface CoinmarketPaymentTypeProps {
    method?: CoinmarketPaymentMethodType;
    methodName?: string;
}

export const CoinmarketPaymentType = ({ method, methodName }: CoinmarketPaymentTypeProps) => (
    <Row gap={spacings.xs}>
        {method && <img width="24px" src={invityAPI.getPaymentMethodUrl(method)} alt="" />}
        <CoinmarketPaymentPlainType method={method} methodName={methodName} />
    </Row>
);
