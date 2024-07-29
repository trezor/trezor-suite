import { CoinmarketTradeBuySellType } from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import { CoinmarketPaymentPlainType } from '../CoinmarketPaymentPlainType';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { BuySellQuote } from './CoinmarketFeaturedOffersItem';

const PaymentInfoWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
    gap: ${spacingsPx.xxs};
`;

const CoinmarketFeaturedOffersPaymentInfo = ({
    quote,
    type,
}: {
    quote: BuySellQuote;
    type: CoinmarketTradeBuySellType;
}) => (
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

export default CoinmarketFeaturedOffersPaymentInfo;
