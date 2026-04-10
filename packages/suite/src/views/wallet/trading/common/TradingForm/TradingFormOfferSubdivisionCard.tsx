import { Translation } from '@suite/intl';
import { Card, Paragraph } from '@trezor/components';

export const TradingFormOfferSubdivisionCard = () => (
    <Card>
        <Paragraph
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            align="center"
            margin={{ vertical: 8 }}
            data-testid="trading-offer-subdivision-required"
        >
            <Translation id="TR_TRADING_SUBDIVISION_REQUIRED_FOR_OFFERS" />
        </Paragraph>
    </Card>
);
