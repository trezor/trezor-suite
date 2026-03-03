import { Translation } from '@suite/intl';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Box, Card, Column, IconCircle, Text, TextButton } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_SOL_SEND } from '@trezor/urls';

type ExpiredTxValidityProps = {
    symbol: NetworkSymbol;
};

export const ExpiredTxValidity = ({ symbol }: ExpiredTxValidityProps) => {
    const networkName = getNetwork(symbol).name;

    return (
        <Card fillType="flat">
            <Column gap={spacings.xs}>
                <Box margin={{ bottom: spacings.md }}>
                    <IconCircle name="warning" size={112} intent="critical" />
                </Box>

                <Text typographyStyle="headline-sm">
                    <Translation id="TR_TX_SEND_FAILED_TITLE" />
                </Text>
                <Translation id="TR_TX_SEND_FAILED_DESCRIPTION" values={{ networkName }} />

                <TextButton href={HELP_CENTER_SOL_SEND} size="small" isUnderlined>
                    <Translation id="TR_LEARN_MORE" />
                </TextButton>
            </Column>
        </Card>
    );
};
