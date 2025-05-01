import { SellFiatTrade } from 'invity-api';
import styled, { useTheme } from 'styled-components';

import {
    type TradingTradeType,
    type TradingType,
    getTagAndInfoNote,
    sellUtils,
} from '@suite-common/trading';
import { Badge, Button, Card, Text } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TradingTradeDetailBuySellType } from 'src/types/trading/trading';
import { TradingFormContextValues } from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingFeaturedOffersAmounts } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffersAmounts';
import { TradingFeaturedOffersPaymentInfo } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffersPaymentInfo';
import { TradingUtilsProvider } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsProvider';

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

interface TradingOffersItemProps {
    quote: TradingTradeType;
    context: TradingFormContextValues<TradingType>;
    isBestRate: boolean;
}

const actionButtonText = (
    context: TradingFormContextValues<TradingType>,
    quote: TradingTradeType,
) => {
    if (isTradingBuyContext(context)) {
        return <Translation id="TR_BUY" />;
    }
    if (isTradingSellContext(context)) {
        if (
            context.sellInfo &&
            sellUtils.needToRegisterOrVerifyBankAccount({
                quote: quote as SellFiatTrade,
                sellInfo: context.sellInfo,
            })
        ) {
            return <Translation id="TR_SELL_REGISTER" />;
        }
    }
    if (isTradingExchangeContext(context)) {
        return <Translation id="TR_TRADING_SWAP" />;
    }
};

export const TradingFeaturedOffersItem = ({ context, quote }: TradingOffersItemProps) => {
    const theme = useTheme();
    const {
        form: {
            state: { isFormLoading },
        },
        type,
    } = context;
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
                    <TradingFeaturedOffersAmounts quote={quote} />
                </OfferColumn1>
                <OfferColumn2>
                    <TradingUtilsProvider exchange={quote.exchange} providers={providers} />
                    {!isTradingExchangeContext(context) && (
                        <TradingFeaturedOffersPaymentInfo
                            quote={quote as TradingTradeDetailBuySellType}
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
                            isLoading={isFormLoading}
                            isDisabled={!!quote.error || isFormLoading}
                            onClick={() => selectQuote(quote)}
                            data-testid="@trading/featured-offers/get-this-deal-button"
                        >
                            {actionButtonText(context, quote)}
                        </Button>
                    )}
                </OfferColumn3>
            </Offer>
        </Card>
    );
};
