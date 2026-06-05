import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ThunkDispatch } from 'redux-thunk';

import { Translation } from '@suite/intl';
import {
    MetadataProviderSelectionModal,
    type MetadataRootState,
    connectProvider,
    metadataActions,
    metadataLabelingActions,
    selectSelectedProviderForLabels,
} from '@suite/metadata';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { type MetadataProviderType } from '@suite-common/metadata-types';
import { type AnyAction, type ExtraDependencies } from '@suite-common/redux-utils';
import { selectEnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

import { selectMetadataMigrationDep } from './createMetadataMigrationCompositionRoot';
import type { MigrationError } from './legacyLabelsMigration';
import { isMigratableDevice } from './migrationUtils';

type LegacyLabelingMigrationModalProps = {
    onCancel: () => void;
    onFinish: () => void;
    onSuiteSyncError: (params: {
        error: MigrationError['cause'];
        deviceStaticSessionId: StaticSessionId;
    }) => void;
};

type MetadataDispatch = ThunkDispatch<MetadataRootState, ExtraDependencies, AnyAction>;

export const LegacyLabelingMigrationModal = ({
    onCancel,
    onFinish,
    onSuiteSyncError,
}: LegacyLabelingMigrationModalProps) => {
    const dispatch = useDispatch<MetadataDispatch>();
    const { migrateLegacyLabelsToSuiteSync } = useServices(selectMetadataMigrationDep);
    const { ensureWalletSuiteSyncOn } = useServices(selectEnsureWalletSuiteSyncOnDep);
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

        const ensureResult = await ensureWalletSuiteSyncOn({
            deviceStaticSessionId: selectedDevice.state.staticSessionId,
            isWriteMode: true,
        });

        if (!ensureResult.success) {
            onSuiteSyncError({
                error: ensureResult.error,
                deviceStaticSessionId: selectedDevice.state.staticSessionId,
            });
            setError('Migration failed. Try again.');
            setProviderLoading(null);

            return;
        }

        const result = await migrateLegacyLabelsToSuiteSync(selectedDevice, ensureResult.payload);

        if (result.success) {
            const { walletDescriptor } = parseStaticSessionId(selectedDevice.state.staticSessionId);

            dispatch(metadataActions.setLegacyLabelsMigrationForWallet(walletDescriptor));
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
