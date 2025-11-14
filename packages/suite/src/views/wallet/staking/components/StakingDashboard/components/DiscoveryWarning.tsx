import { Banner, H4, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

export const DiscoveryWarning = () => (
    <Banner intent="warning" data-testid="@warning/trezorDiscovery" icon="spinnerGap">
        <H4>
            <Translation id="TR_DISCOVERY_WARNING_TITLE" />
        </H4>
        <Paragraph>
            <Translation id="TR_DISCOVERY_WARNING_DESCRIPTION" />
        </Paragraph>
    </Banner>
);
