import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

/**
 * This is very unimportant warning and should be displayed only under specific conditions (see caller) so that we don't bother users that don't need to care.
 * To get into trouble user would need to:
 * 1] use suite-web
 * 2] have standalone bridge running
 * 3] have webusb disabled in debug settings or be using Firefox browser.
 */
export const LocalNetworkAccessPermission = () => (
    <Banner
        icon
        intent="info"
        description={<Translation id="TR_LOCAL_NETWORK_ACCESS_PERMISSION_WARNING" />}
    />
);
