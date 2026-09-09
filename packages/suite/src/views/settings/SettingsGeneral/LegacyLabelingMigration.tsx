import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';
import { suiteSyncErrorHandler } from '@suite/suite-sync';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

export const LegacyLabelingMigration = () => {
    const { dispatch } = useServices(selectDispatch);

    return (
        <MetadataMigrationLegacyLabelingMigration
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
