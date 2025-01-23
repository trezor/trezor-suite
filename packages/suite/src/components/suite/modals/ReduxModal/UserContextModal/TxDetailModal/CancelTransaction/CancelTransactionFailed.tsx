import { Box, Card, Column, IconCircle, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_CANCEL_TRANSACTION } from '@trezor/urls';

import { Translation } from '../../../../../Translation';
import { TrezorLink } from '../../../../../TrezorLink';

export const CancelTransactionFailed = () => (
    <Card fillType="flat">
        <Column gap={spacings.xs}>
            <Box margin={{ bottom: spacings.md }}>
                <IconCircle name="warning" size={110} variant="destructive" />
            </Box>

            <Text typographyStyle="titleSmall">
                <Translation id="TR_CANCEL_TX_FAILED" />
            </Text>
            <Translation id="TR_CANCEL_TX_FAILED_DESCRIPTION" />

            <TrezorLink
                typographyStyle="hint"
                href={HELP_CENTER_CANCEL_TRANSACTION}
                icon="arrowUpRight"
            >
                <Translation id="TR_LEARN_MORE" />
            </TrezorLink>
        </Column>
    </Card>
);
