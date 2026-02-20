import { useSelector } from 'react-redux';

import { selectShouldDisplayOutOfQuotaAlert } from '@suite-common/suite-sync-quota-manager';

import { SuiteSyncKeysAlert } from './SuiteSyncKeysAlert';
import {
    selectShouldDisplaySuiteSyncAlert,
    selectShouldDisplaySuiteSyncFirmwareUpdateAlert,
    selectShouldDisplayUpgradeFirmwareAlert,
} from '../homescreenSelectors';
import { FirmwareUpdateAlert } from './FirmwareUpdateAlert';
import { OutOfQuotaAlert } from './OutOfQuotaAlert';
import { SuiteSyncFirmwareUpdateAlert } from './SuiteSyncFirmwareUpdateAlert';

export const HomescreenAlerts = () => {
    const shouldDisplayOutOfQuotaAlert = useSelector(selectShouldDisplayOutOfQuotaAlert);
    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);
    const shouldDisplaySuiteSyncFirmwareUpdateAlert = useSelector(
        selectShouldDisplaySuiteSyncFirmwareUpdateAlert,
    );
    const shouldDisplayFirmwareUpdateAlert = useSelector(selectShouldDisplayUpgradeFirmwareAlert);

    if (shouldDisplaySuiteSyncAlert) {
        return <SuiteSyncKeysAlert />;
    }

    if (shouldDisplaySuiteSyncFirmwareUpdateAlert) {
        return <SuiteSyncFirmwareUpdateAlert />;
    }

    if (shouldDisplayFirmwareUpdateAlert) {
        return <FirmwareUpdateAlert />;
    }

    if (shouldDisplayOutOfQuotaAlert) {
        return <OutOfQuotaAlert />;
    }

    return null;
};
