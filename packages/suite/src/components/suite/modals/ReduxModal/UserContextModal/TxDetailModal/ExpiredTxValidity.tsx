import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Box, Card, Column, IconCircle, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_SOL_SEND } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';

type ExpiredTxValidityProps = {
    symbol: NetworkSymbol;
};

export const ExpiredTxValidity = ({ symbol }: ExpiredTxValidityProps) => {
    const networkName = getNetwork(symbol).name;

    return (
        <Card fillType="flat">
            <Column gap={spacings.xs}>
                <Box margin={{ bottom: spacings.md }}>
                    <IconCircle name="warning" size={110} variant="destructive" />
                </Box>

                <Text typographyStyle="titleSmall">
                    <Translation id="TR_TX_SEND_FAILED_TITLE" />
                </Text>
                <Translation id="TR_TX_SEND_FAILED_DESCRIPTION" values={{ networkName }} />

                <TrezorLink typographyStyle="hint" href={HELP_CENTER_SOL_SEND} icon="arrowUpRight">
                    <Translation id="TR_LEARN_MORE" />
                </TrezorLink>
            </Column>
        </Card>
    );
};
