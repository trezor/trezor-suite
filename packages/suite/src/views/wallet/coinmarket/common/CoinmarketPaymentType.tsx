import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { invityAPI, type TradingPaymentMethodType } from '@suite-common/invity';

import { CoinmarketPaymentPlainType } from 'src/views/wallet/coinmarket/common/CoinmarketPaymentPlainType';
import { CoinmarketIcon } from 'src/views/wallet/coinmarket/common/CoinmarketIcon';

interface CoinmarketPaymentTypeProps {
    method?: TradingPaymentMethodType;
    methodName?: string;
}

export const CoinmarketPaymentType = ({ method, methodName }: CoinmarketPaymentTypeProps) => (
    <Row gap={spacings.xs}>
        {method && <CoinmarketIcon iconUrl={invityAPI.getPaymentMethodUrl(method)} />}
        <CoinmarketPaymentPlainType method={method} methodName={methodName} />
    </Row>
);
