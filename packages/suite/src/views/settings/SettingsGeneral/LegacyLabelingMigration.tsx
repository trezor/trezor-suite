import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';
import { suiteSyncErrorHandler } from '@suite/suite-sync';
import { useDispatch } from '@suite-common/redux-utils';

export const LegacyLabelingMigration = () => {
    const dispatch = useDispatch();

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
