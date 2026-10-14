import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { WifiSlashIcon } from '@trezor/icons';

export const NoConnectionBanner = () => (
    <Banner
        icon={WifiSlashIcon}
        intent="warning"
        description={<Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />}
        data-testid="@suite/no-connection-banner"
    />
);
