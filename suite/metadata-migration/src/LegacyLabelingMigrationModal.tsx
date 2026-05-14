import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ThunkDispatch } from 'redux-thunk';

import { Translation } from '@suite/intl';
import {
    MetadataProviderSelectionModal,
    type MetadataRootState,
    connectProvider,
    metadataLabelingActions,
    selectSelectedProviderForLabels,
} from '@suite/metadata';
import { selectSelectedDevice } from '@suite-common/device';
import { type MetadataProviderType } from '@suite-common/metadata-types';
import { type AnyAction, type ExtraDependencies } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type StaticSessionId } from '@trezor/connect';

import type { MigrationError } from './legacyLabelsMigration';
import type { MigrateLegacyLabelsToSuiteSync } from './migrateLegacyLabelsToSuiteSync';
import { isMigratableDevice } from './migrationUtils';

type LegacyLabelingMigrationModalProps = {
    onCancel: () => void;
    onFinish: () => void;
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
    onSuiteSyncError: (params: {
        error: MigrationError['cause'];
        deviceStaticSessionId: StaticSessionId;
    }) => void;
};

type MetadataDispatch = ThunkDispatch<MetadataRootState, ExtraDependencies, AnyAction>;

export const LegacyLabelingMigrationModal = ({
    onCancel,
    onFinish,
    migrateLegacyLabelsToSuiteSync,
    onSuiteSyncError,
}: LegacyLabelingMigrationModalProps) => {
    const dispatch = useDispatch<MetadataDispatch>();
    const selectedProvider = useSelector(selectSelectedProviderForLabels);
    const selectedDevice = useSelector(selectSelectedDevice);
    const [providerLoading, setProviderLoading] = useState<MetadataProviderType | null>(null);
    const [error, setError] = useState('');

    const isMigratable = isMigratableDevice(selectedDevice);

    const handleMigrate = async (providerType: MetadataProviderType) => {
        if (!isMigratableDevice(selectedDevice)) {
            setError('Connect device to continue.');

            return;
        }

        setError('');
        setProviderLoading(providerType);

        const isProviderAlreadyConnected = selectedProvider?.type === providerType;

        if (!isProviderAlreadyConnected) {
            const providerConnected = await dispatch(connectProvider({ type: providerType }));

            if (providerConnected === 'window closed') {
                setProviderLoading(null);

                return;
            }

            if (typeof providerConnected === 'string') {
                setError(providerConnected);
                setProviderLoading(null);

                return;
            }

            if (!providerConnected) {
                setError('Migration failed. Try again.');
                setProviderLoading(null);

                return;
            }
        }

        const initialized = await dispatch(
            metadataLabelingActions.init(true, selectedDevice.state.staticSessionId),
        );

        if (!initialized) {
            setError('Migration failed. Try again.');
            setProviderLoading(null);

            return;
        }

        const result = await migrateLegacyLabelsToSuiteSync(selectedDevice);

        if (result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'legacy-labeling-migration-success',
                    added: result.payload.changed,
                    skipped: result.payload.skipped,
                }),
            );
        } else {
            onSuiteSyncError({
                error: result.error.cause,
                deviceStaticSessionId: result.error.deviceStaticSessionId,
            });

            setError('Migration failed. Try again.');
        }

        setProviderLoading(null);

        if (result.success) {
            onFinish();
        }
    };

    return (
        <MetadataProviderSelectionModal
            onCancel={onCancel}
            onSelect={handleMigrate}
            loadingProvider={providerLoading ?? ''}
            isDisabled={!isMigratable}
            error={error || (!isMigratable ? 'Connect device to continue.' : '')}
            heading={<Translation id="TR_LABELING_MIGRATION_MODAL_HEADING" />}
            description={<Translation id="TR_LABELING_MIGRATION_MODAL_DESCRIPTION" />}
            testId="@modal/legacy-labeling-migration"
        />
    );
};
