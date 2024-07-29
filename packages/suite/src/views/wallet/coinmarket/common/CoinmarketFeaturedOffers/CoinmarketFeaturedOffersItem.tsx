import styled from 'styled-components';
import { Badge, Button, Card } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { CoinmarketUtilsProvider } from '../CoinmarketUtils/CoinmarketUtilsProvider';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { BuyTrade, SellFiatTrade } from 'invity-api';
import {
    CoinmarketBuyFormContextProps,
    CoinmarketSellFormContextProps,
} from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFeaturedOffersAmounts from './CoinmarketFeaturedOffersAmounts';
import CoinmarketFeaturedOffersPaymentInfo from './CoinmarketFeaturedOffersPaymentInfo';

const OfferWrap = styled(Card)`
    min-height: 100px;
`;

const Offer = styled.div`
    display: flex;
    min-height: 100px;
    gap: ${spacingsPx.md};

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        flex-wrap: wrap;
    }
`;

const OfferColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex: none;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

const OfferColumn1 = styled(OfferColumn)`
    width: 50%;
    justify-content: space-between;
`;

const OfferColumn2 = styled(OfferColumn)`
    flex-grow: 1;
    justify-content: center;
    gap: ${spacingsPx.xs};
`;

const OfferColumn3 = styled(OfferColumn)`
    margin-left: auto;
    justify-content: center;
`;

const OfferBadgeWrap = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
`;

const OfferBadge = styled(Badge)`
    margin-right: ${spacingsPx.xs};
    margin-bottom: ${spacingsPx.xs};
`;

const OfferBadgeInfo = styled.div`
    ${typography.label};
    margin-bottom: ${spacingsPx.xs};
    padding: ${spacingsPx.xxxs} 0;
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledButton = styled(Button)`
    width: 168px;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

export type BuySellQuote = BuyTrade | SellFiatTrade;
export type BuySellContext = CoinmarketBuyFormContextProps | CoinmarketSellFormContextProps;

interface CoinmarketOffersItemProps {
    quote: BuySellQuote;
    context: BuySellContext;
    isBestRate: boolean;
}

const actionButtonText = (context: BuySellContext, quote: BuySellQuote) => {
    if (
        isCoinmarketSellOffers(context) &&
        context.needToRegisterOrVerifyBankAccount(quote as SellFiatTrade)
    ) {
        return <Translation id="TR_SELL_REGISTER" />;
    }
    if (isCoinmarketBuyOffers(context)) {
        return <Translation id="TR_COINMARKET_FEATURED_OFFER_BUY" />;
    }
    if (isCoinmarketSellOffers(context)) {
        return <Translation id="TR_COINMARKET_FEATURED_OFFER_SELL" />;
    }
};

const CoinmarketFeaturedOffersItem = ({
    context,
    quote,
    isBestRate,
}: CoinmarketOffersItemProps) => {
    const { callInProgress, type } = context;
    const providers = getProvidersInfoProps(context);
    const cryptoAmountProps = getCryptoQuoteAmountProps(quote, context);
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const selectQuote = getSelectQuoteTyped(context);

    if (!cryptoAmountProps) return null;

    return (
        <OfferWrap margin={{ top: spacings.md }}>
            <Offer>
                <OfferColumn1>
                    <OfferBadgeWrap>
                        {isBestRate && (
                            <OfferBadge variant="primary">
                                <Translation id="TR_COINMARKET_BEST_RATE" />
                            </OfferBadge>
                        )}
                        {tag && <OfferBadge variant="tertiary">{tag}</OfferBadge>}
                        {infoNote && <OfferBadgeInfo>{infoNote}</OfferBadgeInfo>}
                    </OfferBadgeWrap>
                    <CoinmarketFeaturedOffersAmounts quote={quote} />
                </OfferColumn1>
                <OfferColumn2>
                    <CoinmarketUtilsProvider exchange={quote.exchange} providers={providers} />
                    <CoinmarketFeaturedOffersPaymentInfo quote={quote} type={type} />
                </OfferColumn2>
                <OfferColumn3>
                    {quote.status === 'LOGIN_REQUEST' ? (
                        <StyledButton variant="tertiary" onClick={() => selectQuote(quote)}>
                            <Translation id="TR_LOGIN_PROCEED" />
                        </StyledButton>
                    ) : (
                        <StyledButton
                            variant="tertiary"
                            isLoading={callInProgress}
                            isDisabled={!!quote.error || callInProgress}
                            onClick={() => selectQuote(quote)}
                            data-test="@coinmarket/featured-offers/get-this-deal-button"
                        >
                            {actionButtonText(context, quote)}
                        </StyledButton>
                    )}
                </OfferColumn3>
            </Offer>
        </OfferWrap>
    );
};

export default CoinmarketFeaturedOffersItem;
