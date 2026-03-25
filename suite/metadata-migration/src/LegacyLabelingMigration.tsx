import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectIsSuiteSyncDebugEnabled, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { Tooltip } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { LegacyLabelingMigrationModal } from './LegacyLabelingMigrationModal';
import type { MigrationError } from './legacyLabelsMigration';
import type { MigrateLegacyLabelsToSuiteSync } from './migrateLegacyLabelsToSuiteSync';
import { isMigratableDevice } from './migrationUtils';

export type LegacyLabelingMigrationProps = {
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
    onSuiteSyncError: (params: {
        error: MigrationError['cause'];
        deviceStaticSessionId: StaticSessionId;
    }) => void;
};

export const LegacyLabelingMigration = ({
    migrateLegacyLabelsToSuiteSync,
    onSuiteSyncError,
}: LegacyLabelingMigrationProps) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);

    const isMigratable = isMigratableDevice(selectedDevice);

    // Todo: remove the `isSuiteSyncDebugEnabled` check after we are confident to offer migration
    if (!isSuiteSyncEnabled || !isSuiteSyncDebugEnabled) {
        return null;
    }

    return (
        <>
            {isModalVisible && (
                <LegacyLabelingMigrationModal
                    onCancel={() => setIsModalVisible(false)}
                    onFinish={() => setIsModalVisible(false)}
                    migrateLegacyLabelsToSuiteSync={migrateLegacyLabelsToSuiteSync}
                    onSuiteSyncError={onSuiteSyncError}
                />
            )}

            <Anchor anchorId={SettingsAnchor.LabelingMigration}>
                {({ anchorId, anchorRef, shouldHighlight }) => (
                    <SectionItem
                        data-testid={anchorId}
                        ref={anchorRef}
                        shouldHighlight={shouldHighlight}
                    >
                        <TextColumn
                            title={<Translation id="TR_LABELING_MIGRATION_TITLE" />}
                            description={<Translation id="TR_LABELING_MIGRATION_DESCRIPTION" />}
                        />
                        <ActionColumn>
                            <Tooltip
                                content={
                                    isMigratable ? undefined : (
                                        <Translation id="TR_DEVICE_NOT_CONNECTED" />
                                    )
                                }
                            >
                                <ActionButton
                                    intent="brand"
                                    onClick={() => setIsModalVisible(true)}
                                    isDisabled={!isMigratable}
                                    data-testid="@settings/metadata/migrate-button"
                                >
                                    <Translation id="TR_MIGRATE" />
                                </ActionButton>
                            </Tooltip>
                        </ActionColumn>
                    </SectionItem>
                )}
            </Anchor>
        </>
    );
};
