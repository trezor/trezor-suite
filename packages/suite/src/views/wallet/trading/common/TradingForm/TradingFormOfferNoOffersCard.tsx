import { Translation } from '@suite/intl';
import { Card, Paragraph } from '@trezor/components';

interface TradingFormOfferNoOffersCardProps {
    isAmountEmpty: boolean;
}

export const TradingFormOfferNoOffersCard = ({
    isAmountEmpty,
}: TradingFormOfferNoOffersCardProps) => (
    <Card>
        <Paragraph
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            align="center"
            margin={{ vertical: 8 }}
            data-testid="trading-offer-found-none"
        >
            <Translation
                id={isAmountEmpty ? 'TR_BUY_SELL_OFFERS_EMPTY' : 'TR_TRADING_NO_OFFER_BUY_OR_SELL'}
            />
        </Paragraph>
    </Card>
);
