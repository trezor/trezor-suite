import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { PaymentMethodPlainType } from '@suite/trading';
import type { TradingType } from '@suite-common/trading';
import { spacingsPx } from '@trezor/theme';

import {
    type TradingTradeBuySellType,
    type TradingTradeDetailBuySellType,
} from 'src/types/trading/trading';

const PaymentInfoWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.contentSecondary};
    gap: ${spacingsPx.xxs};
`;

interface TradingFeaturedOffersPaymentInfoProps {
    quote: TradingTradeDetailBuySellType;
    type: TradingType;
}

export const TradingFeaturedOffersPaymentInfo = ({
    quote,
    type,
}: TradingFeaturedOffersPaymentInfoProps) => (
    <PaymentInfoWrapper>
        <Translation
            id={`TR_TRADING_FEATURED_OFFER_PAYMENT_METHOD_${type.toUpperCase() as Uppercase<TradingTradeBuySellType>}_LABEL`}
        />
        <PaymentMethodPlainType method={quote.paymentMethod} methodName={quote.paymentMethodName} />
    </PaymentInfoWrapper>
);
