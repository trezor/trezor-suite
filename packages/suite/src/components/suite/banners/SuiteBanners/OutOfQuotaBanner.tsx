import { useDispatch } from 'react-redux';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import {
    noQuotaLeftWarningDismissed,
    selectShouldDisplayOutOfQuotaAlert,
} from '@suite-common/suite-sync-quota-manager';
import { Banner, Button, IconButton } from '@trezor/components';
import { InfoIcon, XIcon } from '@trezor/icons';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';
export const OutOfQuotaBanner = () => {
    const dispatch = useDispatch();

    const href = useExternalLink(TREZOR_SUPPORT_URL);
    const device = useSelector(selectSelectedDevice);

    const shouldDisplay = useSelector(selectShouldDisplayOutOfQuotaAlert);

    if (shouldDisplay === false) return null;

    const handleDismiss = () => {
        if (!device?.id) return false;

        dispatch(noQuotaLeftWarningDismissed({ deviceId: device.id }));
    };

    return (
        <Banner
            intent="info"
            icon={InfoIcon}
            description={<Translation id="TR_SUITE_SYNC_OUT_OF_QUOTA_BANNER_DESCRIPTION" />}
            rightContent={
                <>
                    <Button intent="info" href={href}>
                        <Translation id="TR_CONTACT_SUPPORT" />
                    </Button>
                    <IconButton
                        icon={XIcon}
                        intent="info"
                        priority="secondary"
                        onClick={handleDismiss}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    />
                </>
            }
        />
    );
};
