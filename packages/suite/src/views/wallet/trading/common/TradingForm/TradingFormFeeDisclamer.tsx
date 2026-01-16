import { Translation } from '@suite/intl';
import { Button, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { INVITY_SCHEDULE_OF_FEES } from '@trezor/urls';

import { ContentFlex } from '../../../../../support/suite/ContentFlex';

export const TradingFormFeesDisclamer = () => (
    <ContentFlex gap={spacings.sm}>
        <Paragraph variant="tertiary">
            <Translation id="TR_TRADING_FEES_CALCULATION_DISCLAIMER" />
        </Paragraph>
        <Button href={INVITY_SCHEDULE_OF_FEES} intent="neutral" priority="secondary" size="small">
            <Translation id="TR_LEARN_MORE" />
        </Button>
    </ContentFlex>
);
