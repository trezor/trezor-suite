import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

export const NoConnectionBanner = () => (
    <Banner
        icon
        intent="critical"
        description={<Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />}
        data-testid="@suite/no-connection-banner"
    />
);
