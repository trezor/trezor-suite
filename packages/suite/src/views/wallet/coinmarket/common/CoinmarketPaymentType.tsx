import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import { CoinmarketPaymentMethodType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketIcon } from 'src/views/wallet/coinmarket/common/CoinmarketIcon';

interface CoinmarketPaymentTypeProps {
    method?: CoinmarketPaymentMethodType;
    methodName?: string;
}

export const CoinmarketPaymentType = ({ method, methodName }: CoinmarketPaymentTypeProps) => (
    <Row gap={spacings.xs}>
        {method && <CoinmarketIcon iconUrl={invityAPI.getPaymentMethodUrl(method)} />}
        <CoinmarketPaymentPlainType method={method} methodName={methodName} />
    </Row>
);
