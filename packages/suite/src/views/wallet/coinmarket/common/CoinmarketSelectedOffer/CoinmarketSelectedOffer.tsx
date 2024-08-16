import styled from 'styled-components';
import { Card } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';
import {
    getCryptoQuoteAmountProps,
    getPaymentMethod,
    getProvidersInfoProps,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import {
    isCoinmarketBuyOffers,
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketSelectedOfferSell from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferSell/CoinmarketSelectedOfferSell';
import { CoinmarketVerify } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerify';

const Wrapper = styled.div`
    display: flex;
    margin: ${spacingsPx.lg} 0;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

export const CoinmarketSelectedOffer = () => {
    const context = useCoinmarketFormContext();
    const { selectedQuote } = context;
    const providers = getProvidersInfoProps(context);

    if (!selectedQuote) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(selectedQuote, context);
    const paymentMethod = getPaymentMethod(selectedQuote, context);

    return (
        <Wrapper>
            {isCoinmarketBuyOffers(context) && (
                <StyledCard>
                    <CoinmarketVerify />
                </StyledCard>
            )}
            {isCoinmarketSellOffers(context) && (
                <StyledCard>
                    <CoinmarketSelectedOfferSell />
                </StyledCard>
            )}
            {isCoinmarketExchangeOffers(context) && (
                <StyledCard>
                    <CoinmarketVerify />
                </StyledCard>
            )}
            <CoinmarketSelectedOfferInfo
                selectedQuote={selectedQuote}
                providers={providers}
                quoteAmounts={quoteAmounts}
                type={context.type}
                {...paymentMethod}
            />
        </Wrapper>
    );
};
