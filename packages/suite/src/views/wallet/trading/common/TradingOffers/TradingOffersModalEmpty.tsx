import { Translation } from '@suite/intl';
import { Column, IconCircle, Paragraph } from '@trezor/components';

export const TradingOffersModalEmpty = () => (
    <Column height="60%" justifyContent="center" alignItems="center" gap={24}>
        <IconCircle name="x" size={96} intent="neutral" />
        <Paragraph typographyStyle="body-md-strong">
            <Translation id="TR_NO_OFFERS_AVAILABLE" />
        </Paragraph>
    </Column>
);
