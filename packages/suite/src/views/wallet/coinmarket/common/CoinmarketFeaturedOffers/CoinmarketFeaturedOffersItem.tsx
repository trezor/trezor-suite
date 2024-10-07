import styled, { useTheme } from 'styled-components';
import { Badge, Button, Card, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacings, spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    isCoinmarketBuyContext,
    isCoinmarketExchangeContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { SellFiatTrade } from 'invity-api';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';
import {
    CoinmarketTradeDetailBuySellType,
    CoinmarketTradeDetailType,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketFeaturedOffersAmounts } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffersAmounts';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';
import { CoinmarketFeaturedOffersPaymentInfo } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffersPaymentInfo';

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
    gap: ${spacingsPx.sm};

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
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
    gap: ${spacingsPx.xs};
`;

interface CoinmarketOffersItemProps {
    quote: CoinmarketTradeDetailType;
    context: CoinmarketFormContextValues<CoinmarketTradeType>;
    isBestRate: boolean;
}

const actionButtonText = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
    quote: CoinmarketTradeDetailType,
) => {
    if (isCoinmarketBuyContext(context)) {
        return <Translation id="TR_BUY" />;
    }
    if (isCoinmarketSellContext(context)) {
        if (context.needToRegisterOrVerifyBankAccount(quote as SellFiatTrade))
            return <Translation id="TR_SELL_REGISTER" />;

        return <Translation id="TR_COINMARKET_SELL" />;
    }
    if (isCoinmarketExchangeContext(context)) {
        return <Translation id="TR_COINMARKET_SWAP" />;
    }
};

export const CoinmarketFeaturedOffersItem = ({ context, quote }: CoinmarketOffersItemProps) => {
    const theme = useTheme();
    const { callInProgress, type } = context;
    const providers = getProvidersInfoProps(context);
    const cryptoAmountProps = getCryptoQuoteAmountProps(quote, context);
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const selectQuote = getSelectQuoteTyped(context);

    if (!cryptoAmountProps) return null;

    return (
        <Card margin={{ top: spacings.md }} minHeight={100}>
            <Offer>
                <OfferColumn1>
                    <OfferBadgeWrap>
                        {tag && <Badge variant="tertiary">{tag}</Badge>}
                        {infoNote && (
                            <Text typographyStyle="label" color={theme.textSubdued}>
                                {infoNote}
                            </Text>
                        )}
                    </OfferBadgeWrap>
                    <CoinmarketFeaturedOffersAmounts quote={quote} />
                </OfferColumn1>
                <OfferColumn2>
                    <CoinmarketUtilsProvider exchange={quote.exchange} providers={providers} />
                    {!isCoinmarketExchangeContext(context) && (
                        <CoinmarketFeaturedOffersPaymentInfo
                            quote={quote as CoinmarketTradeDetailBuySellType}
                            type={type}
                        />
                    )}
                </OfferColumn2>
                <OfferColumn3>
                    {quote.status === 'LOGIN_REQUEST' ? (
                        <Button variant="tertiary" isFullWidth onClick={() => selectQuote(quote)}>
                            <Translation id="TR_LOGIN_PROCEED" />
                        </Button>
                    ) : (
                        <Button
                            variant="tertiary"
                            isFullWidth
                            isLoading={callInProgress}
                            isDisabled={!!quote.error || callInProgress}
                            onClick={() => selectQuote(quote)}
                            data-testid="@coinmarket/featured-offers/get-this-deal-button"
                        >
                            {actionButtonText(context, quote)}
                        </Button>
                    )}
                </OfferColumn3>
            </Offer>
        </Card>
    );
};
