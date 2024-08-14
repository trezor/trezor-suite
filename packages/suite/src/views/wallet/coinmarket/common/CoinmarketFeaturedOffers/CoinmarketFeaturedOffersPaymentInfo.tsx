import {
    CoinmarketTradeBuySellType,
    CoinmarketTradeDetailType,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import { CoinmarketPaymentPlainType } from '../CoinmarketPaymentPlainType';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { isExchangeTrade } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';

const PaymentInfoWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
    gap: ${spacingsPx.xxs};
`;

export const CoinmarketFeaturedOffersPaymentInfo = ({
    quote,
    type,
}: {
    quote: CoinmarketTradeDetailType;
    type: CoinmarketTradeType;
}) => {
    if (isExchangeTrade(quote)) return null;

    return (
        <PaymentInfoWrapper>
            <Translation
                id={`TR_COINMARKET_FEATURED_OFFER_PAYMENT_METHOD_${type.toUpperCase() as Uppercase<CoinmarketTradeBuySellType>}_LABEL`}
            />
            <CoinmarketPaymentPlainType
                method={quote.paymentMethod}
                methodName={quote.paymentMethodName}
            />
        </PaymentInfoWrapper>
    );
};
