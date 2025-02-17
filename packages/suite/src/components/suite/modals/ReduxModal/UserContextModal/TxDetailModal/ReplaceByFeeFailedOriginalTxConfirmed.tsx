import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import { RbfTransactionType } from '@suite-common/wallet-types';
import { Box, Card, Column, IconCircle, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    HELP_CENTER_CANCEL_TRANSACTION,
    HELP_CENTER_REPLACE_BY_FEE_BITCOIN,
    Url,
} from '@trezor/urls';

import { Translation, TranslationKey } from '../../../../Translation';
import { TrezorLink } from '../../../../TrezorLink';

export type ReplaceByFeeFailedOriginalTxConfirmedProps = {
    type: RbfTransactionType;
    networkSymbol: NetworkSymbol;
};

const titleMap: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], TranslationKey> = {
    'bump-fee': 'TR_REPLACE_BY_FEE_FAILED_ALREADY_MINED',
    cancel: 'TR_CANCEL_TX_FAILED_ALREADY_MINED',
};

const descriptionMap: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], TranslationKey> = {
    'bump-fee': 'TR_REPLACE_BY_FEE_FAILED_ALREADY_MINED_DESCRIPTION',
    cancel: 'TR_CANCEL_TX_FAILED_ALREADY_MINED_DESCRIPTION',
};

const helpLink: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], Url> = {
    'bump-fee': HELP_CENTER_REPLACE_BY_FEE_BITCOIN,
    cancel: HELP_CENTER_CANCEL_TRANSACTION,
};

export const ReplaceByFeeFailedOriginalTxConfirmed = ({
    type,
    networkSymbol,
}: ReplaceByFeeFailedOriginalTxConfirmedProps) => (
    <Card fillType="flat">
        <Column gap={spacings.xs}>
            <Box margin={{ bottom: spacings.md }}>
                <IconCircle name="warning" size={110} variant="destructive" />
            </Box>

            <Text typographyStyle="titleSmall">
                <Translation id={titleMap[type]} />
            </Text>
            <Translation
                id={descriptionMap[type]}
                values={{ network: networks[networkSymbol].name }}
            />

            <TrezorLink typographyStyle="hint" href={helpLink[type]} icon="arrowUpRight">
                <Translation id="TR_LEARN_MORE" />
            </TrezorLink>
        </Column>
    </Card>
);
