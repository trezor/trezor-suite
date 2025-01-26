import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { invityAPI, type TradingPaymentMethodType } from '@suite-common/invity';

import { TradingPaymentPlainType } from 'src/views/wallet/trading/common/TradingPaymentPlainType';
import { TradingIcon } from 'src/views/wallet/trading/common/TradingIcon';

interface TradingPaymentTypeProps {
    method?: TradingPaymentMethodType;
    methodName?: string;
}

export const TradingPaymentType = ({ method, methodName }: TradingPaymentTypeProps) => (
    <Row gap={spacings.xs}>
        {method && <TradingIcon iconUrl={invityAPI.getPaymentMethodUrl(method)} />}
        <TradingPaymentPlainType method={method} methodName={methodName} />
    </Row>
);
