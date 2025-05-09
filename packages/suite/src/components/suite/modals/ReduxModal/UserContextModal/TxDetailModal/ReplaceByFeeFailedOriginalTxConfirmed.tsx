import { NetworkType } from '@suite-common/wallet-config';
import { RbfTransactionType } from '@suite-common/wallet-types';
import { Box, Card, Column, IconCircle, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    HELP_CENTER_CANCEL_TRANSACTION,
    HELP_CENTER_REPLACE_BY_FEE_BITCOIN,
    HELP_CENTER_REPLACE_BY_FEE_ETHEREUM,
    Url,
} from '@trezor/urls';

import { Translation, TranslationKey } from '../../../../Translation';
import { TrezorLink } from '../../../../TrezorLink';

export type ReplaceByFeeFailedOriginalTxConfirmedProps = {
    type: RbfTransactionType;
    networkType: NetworkType;
};

const titleMap: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], TranslationKey> = {
    'bump-fee': 'TR_REPLACE_BY_FEE_FAILED_ALREADY_MINED',
    cancel: 'TR_CANCEL_TX_FAILED_ALREADY_MINED',
};

const descriptionMap: Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], TranslationKey> = {
    'bump-fee': 'TR_REPLACE_BY_FEE_FAILED_ALREADY_MINED_DESCRIPTION',
    cancel: 'TR_CANCEL_TX_FAILED_ALREADY_MINED_DESCRIPTION',
};

const helpLink: Record<
    NetworkType,
    Record<ReplaceByFeeFailedOriginalTxConfirmedProps['type'], Url | null> | null
> = {
    bitcoin: {
        'bump-fee': HELP_CENTER_REPLACE_BY_FEE_BITCOIN,
        cancel: HELP_CENTER_CANCEL_TRANSACTION,
    },
    cardano: null,
    ethereum: {
        'bump-fee': HELP_CENTER_REPLACE_BY_FEE_ETHEREUM,
        cancel: null,
    },
    ripple: null,
    solana: null,
    stellar: null,
};

export const ReplaceByFeeFailedOriginalTxConfirmed = ({
    type,
    networkType,
}: ReplaceByFeeFailedOriginalTxConfirmedProps) => {
    const link = helpLink[networkType]?.[type];

    return (
        <Card fillType="flat">
            <Column gap={spacings.xs}>
                <Box margin={{ bottom: spacings.md }}>
                    <IconCircle name="warning" size={110} variant="destructive" />
                </Box>

                <Text typographyStyle="titleSmall">
                    <Translation id={titleMap[type]} />
                </Text>
                <Translation id={descriptionMap[type]} />

                {link && (
                    <TrezorLink typographyStyle="hint" href={link} icon="arrowUpRight">
                        <Translation id="TR_LEARN_MORE" />
                    </TrezorLink>
                )}
            </Column>
        </Card>
    );
};
