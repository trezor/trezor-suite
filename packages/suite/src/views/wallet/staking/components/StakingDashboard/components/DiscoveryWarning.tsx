import { Banner, H4, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite';

export const DiscoveryWarning = () => (
    <Banner
        variant="warning"
        data-testid="@warning/trezorDiscovery"
        icon="spinnerGap"
        iconSize="extraLarge"
    >
        <H4>
            <Translation id="TR_DISCOVERY_WARNING_TITLE" />
        </H4>
        <Paragraph>
            <Translation id="TR_DISCOVERY_WARNING_DESCRIPTION" />
        </Paragraph>
    </Banner>
);
