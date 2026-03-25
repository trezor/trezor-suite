import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';

import { suiteSyncErrorHandler } from 'src/components/suite/labeling/suiteSyncErrorHandler';
import { useDispatch } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

export const LegacyLabelingMigration = () => {
    const dispatch = useDispatch();
    const { migrateLegacyLabelsToSuiteSync } = useSuiteServices();

    return (
        <MetadataMigrationLegacyLabelingMigration
            migrateLegacyLabelsToSuiteSync={migrateLegacyLabelsToSuiteSync}
            onSuiteSyncError={({ error, deviceStaticSessionId }) =>
                suiteSyncErrorHandler({
                    error,
                    dispatch,
                    deviceStaticSessionId,
                })
            }
        />
    );
};
