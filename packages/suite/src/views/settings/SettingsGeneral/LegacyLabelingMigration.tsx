import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';
import { SettingsAnchor } from '@suite/router';
import { selectDevices } from '@suite-common/device';
import { selectIsSuiteSyncDebugEnabled, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { notificationsActions } from '@suite-common/toast-notifications';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { suiteSyncErrorHandler } from 'src/components/suite/labeling/suiteSyncErrorHandler';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

export const LegacyLabelingMigration = () => {
    const dispatch = useDispatch();
    const devices = useSelector(selectDevices);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const { migrateLegacyLabelsToSuiteSync } = useSuiteServices();

    if (!isSuiteSyncEnabled || !isSuiteSyncDebugEnabled) {
        return null;
    }

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.LabelingMigration}>
            <MetadataMigrationLegacyLabelingMigration
                devices={devices}
                addToast={notificationsActions.addToast}
                migrateLegacyLabelsToSuiteSync={migrateLegacyLabelsToSuiteSync}
                onSuiteSyncError={({ error, deviceStaticSessionId }) =>
                    suiteSyncErrorHandler({
                        error,
                        dispatch,
                        deviceStaticSessionId,
                    })
                }
            />
        </SettingsSectionItem>
    );
};
