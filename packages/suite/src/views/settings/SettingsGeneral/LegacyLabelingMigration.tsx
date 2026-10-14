import { LegacyLabelingMigration as MetadataMigrationLegacyLabelingMigration } from '@suite/metadata-migration';
import { suiteSyncErrorHandler } from '@suite/suite-sync';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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
