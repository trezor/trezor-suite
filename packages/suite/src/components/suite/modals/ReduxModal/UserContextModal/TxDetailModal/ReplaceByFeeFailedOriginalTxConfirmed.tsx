import { Box, Card, Column, IconCircle, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    HELP_CENTER_CANCEL_TRANSACTION,
    HELP_CENTER_REPLACE_BY_FEE_BITCOIN,
    Url,
} from '@trezor/urls';

import { Translation, TranslationKey } from '../../../../Translation';
import { TrezorLink } from '../../../../TrezorLink';

type ReplaceByFeeFailedOriginalTxConfirmedProps = {
    type: 'replace-by-fee' | 'cancel-transaction';
};

const titleMap: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], TranslationKey> = {
    'replace-by-fee': 'TR_REPLACE_BY_FEE_FAILED_ALREADY_MINED',
    'cancel-transaction': 'TR_CANCEL_TX_FAILED_ALREADY_MINED',
};

const descriptionMap: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], TranslationKey> = {
    'replace-by-fee': 'TR_REPLACE_BY_FEE_FAILED_ALREADY_MINED_DESCRIPTION',
    'cancel-transaction': 'TR_CANCEL_TX_FAILED_ALREADY_MINED_DESCRIPTION',
};

const helpLink: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], Url> = {
    'replace-by-fee': HELP_CENTER_REPLACE_BY_FEE_BITCOIN,
    'cancel-transaction': HELP_CENTER_CANCEL_TRANSACTION,
};

export const ReplaceByFeeFailedOriginalTxConfirmed = ({
    type,
}: ReplaceByFeeFailedOriginalTxConfirmedProps) => (
    <Card fillType="flat">
        <Column gap={spacings.xs}>
            <Box margin={{ bottom: spacings.md }}>
                <IconCircle name="warning" size={110} variant="destructive" />
            </Box>

            <Text typographyStyle="titleSmall">
                <Translation id={titleMap[type]} />
            </Text>
            <Translation id={descriptionMap[type]} />

            <TrezorLink typographyStyle="hint" href={helpLink[type]} icon="arrowUpRight">
                <Translation id="TR_LEARN_MORE" />
            </TrezorLink>
        </Column>
    </Card>
);
