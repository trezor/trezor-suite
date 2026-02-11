import { useSelector } from 'react-redux';

import { selectShouldDisplayOutOfQuotaAlert } from '@suite-common/suite-sync-quota-manager';

import { SuiteSyncKeysAlert } from './SuiteSyncKeysAlert';
import {
    selectShouldDisplaySuiteSyncAlert,
    selectShouldDisplayUpgradeFirmwareAlert,
} from '../homescreenSelectors';
import { FirmwareUpdateAlert } from './FirmwareUpdateAlert';
import { OutOfQuotaAlert } from './OutOfQuotaAlert';

export const HomescreenAlerts = () => {
    const shouldDisplayOutOfQuotaAlert = useSelector(selectShouldDisplayOutOfQuotaAlert);
    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);
    const shouldDisplayFirmwareUpdateAlert = useSelector(selectShouldDisplayUpgradeFirmwareAlert);

    if (shouldDisplaySuiteSyncAlert) {
        return <SuiteSyncKeysAlert />;
    }

    if (shouldDisplayFirmwareUpdateAlert) {
        return <FirmwareUpdateAlert />;
    }

    if (shouldDisplayOutOfQuotaAlert) {
        return <OutOfQuotaAlert />;
    }

    return null;
};
