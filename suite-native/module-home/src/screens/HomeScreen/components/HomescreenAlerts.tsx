import { useSelector } from 'react-redux';

import {
    type ExperimentalFeedbackRootState,
    selectPendingFeedbackFeature,
} from '@suite-common/feedback';
import { selectShouldDisplayOutOfQuotaAlert } from '@suite-common/suite-sync-quota-manager';
import { ExperimentalFeaturesFeedbackAlert } from '@suite-native/experimental-features';
import { type ExperimentalFeature } from '@suite-native/settings';

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

    const pendingFeatureForFeedback = useSelector(
        (state: ExperimentalFeedbackRootState<ExperimentalFeature>) =>
            selectPendingFeedbackFeature(state),
    );

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

    if (pendingFeatureForFeedback) {
        return <ExperimentalFeaturesFeedbackAlert pendingFeature={pendingFeatureForFeedback} />;
    }

    return null;
};
