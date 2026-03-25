import { useState } from 'react';

import { Translation } from '@suite/intl';
import { type AnyAction } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Tooltip } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { LegacyLabelingMigrationModal } from './LegacyLabelingMigrationModal';
import type { MigrationError } from './legacyLabelsMigration';
import type { MigrateLegacyLabelsToSuiteSync } from './migrateLegacyLabelsToSuiteSync';
import { getConnectedMigratableDevices } from './migrationUtils';

export type LegacyLabelingMigrationProps = {
    devices: TrezorDevice[] | undefined;
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

export const LegacyLabelingMigration = ({
    devices,
    migrateLegacyLabelsToSuiteSync,
    addToast,
    onSuiteSyncError,
}: LegacyLabelingMigrationProps) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const migratableDevices = getConnectedMigratableDevices(devices);
    const hasConnectedMigratableDevice = migratableDevices.length > 0;

    return (
        <>
            {isModalVisible && (
                <LegacyLabelingMigrationModal
                    onCancel={() => setIsModalVisible(false)}
                    onFinish={() => setIsModalVisible(false)}
                    migratableDevices={migratableDevices}
                    migrateLegacyLabelsToSuiteSync={migrateLegacyLabelsToSuiteSync}
                    addToast={addToast}
                    onSuiteSyncError={onSuiteSyncError}
                />
            )}

            <TextColumn
                title={<Translation id="TR_LABELING_MIGRATION_TITLE" />}
                description={<Translation id="TR_LABELING_MIGRATION_DESCRIPTION" />}
            />
            <ActionColumn>
                <Tooltip
                    content={
                        hasConnectedMigratableDevice ? undefined : (
                            <Translation id="TR_DEVICE_NOT_CONNECTED" />
                        )
                    }
                >
                    <ActionButton
                        intent="brand"
                        onClick={() => setIsModalVisible(true)}
                        isDisabled={!hasConnectedMigratableDevice}
                        data-testid="@settings/metadata/migrate-button"
                    >
                        <Translation id="TR_MIGRATE" />
                    </ActionButton>
                </Tooltip>
            </ActionColumn>
        </>
    );
};
