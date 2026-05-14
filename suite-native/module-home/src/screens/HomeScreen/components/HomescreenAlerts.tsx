import { useSelector } from 'react-redux';

import {
    type FeatureFeedbackRootState,
    selectPendingFeedbackFeature,
} from '@suite-common/feedback';
import { selectShouldDisplayOutOfQuotaAlert } from '@suite-common/suite-sync-quota-manager';
import { FEEDBACK_FEATURE_CONFIGS } from '@suite-native/experimental-features';
import { FeatureFeedbackAlert } from '@suite-native/feature-feedback';
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
        (state: FeatureFeedbackRootState<ExperimentalFeature>) =>
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
        const { titleKey } = FEEDBACK_FEATURE_CONFIGS[pendingFeatureForFeedback];

        return (
            <FeatureFeedbackAlert
                pendingFeature={pendingFeatureForFeedback}
                featureTitleKey={titleKey}
            />
        );
    }

    return null;
};
