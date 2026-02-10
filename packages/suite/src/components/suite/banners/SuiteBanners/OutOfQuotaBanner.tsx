import { Translation } from '@suite/intl';
import {
    WithSuiteSyncQuotaManagerState,
    noQuotaLeftWarningDismissed,
    selectDeviceDismissedNoQuotaLeftWarning,
    selectLeftDeviceQuota,
} from '@suite-common/suite-sync-quota-manager';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Banner, Button, IconButton } from '@trezor/components';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

import { useDispatch, useExternalLink, useSelector } from 'src/hooks/suite';

export const OutOfQuotaBanner = () => {
    const dispatch = useDispatch();

    const href = useExternalLink(TREZOR_SUPPORT_URL);
    const device = useSelector(selectSelectedDevice);

    const alreadyDismissed = useSelector((state: WithSuiteSyncQuotaManagerState) =>
        selectDeviceDismissedNoQuotaLeftWarning(state, device?.id || ''),
    );
    const quotaLeft = useSelector((state: WithSuiteSyncQuotaManagerState) =>
        selectLeftDeviceQuota(state, device?.id || ''),
    );

    if (quotaLeft === undefined || quotaLeft > 0 || alreadyDismissed) return null;

    const handleDismiss = () => {
        if (!device || !device.id) return false;

        dispatch(noQuotaLeftWarningDismissed({ deviceId: device.id }));
    };

    return (
        <Banner
            intent="info"
            icon="info"
            description={<Translation id="TR_SUITE_SYNC_OUT_OF_QUOTA_BANNER_DESCRIPTION" />}
            rightContent={
                <>
                    <Button intent="info" href={href}>
                        <Translation id="TR_CONTACT_SUPPORT" />
                    </Button>
                    <IconButton
                        icon="x"
                        intent="info"
                        priority="secondary"
                        onClick={handleDismiss}
                    />
                </>
            }
        />
    );
};
