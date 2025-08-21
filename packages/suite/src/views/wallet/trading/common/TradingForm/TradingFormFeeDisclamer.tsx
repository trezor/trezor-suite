import { Button, Flex, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { INVITY_SCHEDULE_OF_FEES } from '@trezor/urls';

import { Translation } from 'src/components/suite';

export const TradingFormFeesDisclamer = () => (
    <Flex gap={spacings.sm}>
        <Paragraph variant="tertiary">
            <Translation id="TR_TRADING_FEES_CALCULATION_DISCLAIMER" />
        </Paragraph>
        <Button
            href={INVITY_SCHEDULE_OF_FEES}
            icon="arrowUpRight"
            iconAlignment="end"
            variant="tertiary"
            size="tiny"
        >
            <Translation id="TR_LEARN_MORE" />
        </Button>
    </Flex>
);
