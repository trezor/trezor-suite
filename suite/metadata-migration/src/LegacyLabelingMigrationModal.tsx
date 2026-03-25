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
import { type MetadataProviderType } from '@suite-common/metadata-types';
import { type AnyAction, type ExtraDependencies } from '@suite-common/redux-utils';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { type StaticSessionId } from '@trezor/connect';

import type { MigrationError } from './legacyLabelsMigration';
import type { MigrateLegacyLabelsToSuiteSync } from './migrateLegacyLabelsToSuiteSync';

type LegacyLabelingMigrationModalProps = {
    onCancel: () => void;
    onFinish: () => void;
    migratableDevices: TrezorDeviceWithState[];
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
    addToast: (_: {
        type: 'legacy-labeling-migration-success';
        added: number;
        skipped: number;
    }) => AnyAction;
    onSuiteSyncError: (params: {
        error: MigrationError['cause'];
        deviceStaticSessionId: StaticSessionId;
    }) => void;
};

type MetadataDispatch = ThunkDispatch<MetadataRootState, ExtraDependencies, AnyAction>;

export const LegacyLabelingMigrationModal = ({
    onCancel,
    onFinish,
    migratableDevices,
    migrateLegacyLabelsToSuiteSync,
    addToast,
    onSuiteSyncError,
}: LegacyLabelingMigrationModalProps) => {
    const dispatch = useDispatch<MetadataDispatch>();
    const selectedProvider = useSelector((state: MetadataRootState) =>
        selectSelectedProviderForLabels(state),
    );
    const [providerLoading, setProviderLoading] = useState<MetadataProviderType | null>(null);
    const [error, setError] = useState('');

    const hasConnectedMigratableDevice = migratableDevices.length > 0;

    const handleMigrate = async (providerType: MetadataProviderType) => {
        if (!hasConnectedMigratableDevice) {
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

        for (const device of migratableDevices) {
            const initialized = await dispatch(
                metadataLabelingActions.init(true, device.state.staticSessionId),
            );

            if (!initialized) {
                setError('Migration failed. Try again.');
                setProviderLoading(null);

                return;
            }
        }

        const result = await migrateLegacyLabelsToSuiteSync();

        if (result.success) {
            dispatch(
                addToast({
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
            isLoading={providerLoading ?? ''}
            isDisabled={!hasConnectedMigratableDevice}
            error={error || (!hasConnectedMigratableDevice ? 'Connect device to continue.' : '')}
            heading={<Translation id="TR_LABELING_MIGRATION_MODAL_HEADING" />}
            description={<Translation id="TR_LABELING_MIGRATION_MODAL_DESCRIPTION" />}
            testId="@modal/legacy-labeling-migration"
        />
    );
};
