import { Translation } from '@suite/intl';
import { Banner, H4, Paragraph } from '@trezor/components';
import { SpinnerGapIcon } from '@trezor/icons';

export const DiscoveryWarning = () => (
    <Banner
        intent="warning"
        data-testid="@warning/trezorDiscovery"
        icon={SpinnerGapIcon}
        description={
            <>
                <H4>
                    <Translation id="TR_DISCOVERY_WARNING_TITLE" />
                </H4>
                <Paragraph>
                    <Translation id="TR_DISCOVERY_WARNING_DESCRIPTION" />
                </Paragraph>
            </>
        }
    />
);
