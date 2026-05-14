import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';
import { suiteSyncErrorHandler } from '@suite/suite-sync';

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
