import { Translation } from '@suite/intl';
import { Card, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

export const TradingOffersEmpty = () => (
    <Card margin={{ top: spacings.md }}>
        <Paragraph align="center" variant="tertiary">
            <Translation id="TR_TRADING_OFFERS_EMPTY" />
        </Paragraph>
    </Card>
);
