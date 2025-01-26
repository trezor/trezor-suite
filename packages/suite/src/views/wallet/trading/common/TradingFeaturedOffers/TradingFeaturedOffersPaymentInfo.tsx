import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';
import type { TradingType } from '@suite-common/invity';

import { TradingTradeBuySellType, TradingTradeDetailBuySellType } from 'src/types/trading/trading';
import { Translation } from 'src/components/suite';
import { TradingPaymentPlainType } from 'src/views/wallet/trading/common/TradingPaymentPlainType';

const PaymentInfoWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
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
        <TradingPaymentPlainType
            method={quote.paymentMethod}
            methodName={quote.paymentMethodName}
        />
    </PaymentInfoWrapper>
);
