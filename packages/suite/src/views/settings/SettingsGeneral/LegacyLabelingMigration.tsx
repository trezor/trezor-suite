import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';
import { suiteSyncErrorHandler } from '@suite/suite-sync';
import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

export const LegacyLabelingMigration = () => {
    const { dispatch } = useServices(injectDispatch);

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
