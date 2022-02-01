import React from 'react';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { SEED_MANUAL_URL } from '@suite-constants/urls';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
interface BackupRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const BackupRecoverySeed = ({ isDeviceLocked }: BackupRecoverySeedProps) => {
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const analytics = useAnalytics();

    const needsBackup = !!device?.features?.needs_backup;
    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                buttonLink={SEED_MANUAL_URL}
            />
            <ActionColumn>
                <ActionButton
                    data-test="@settings/device/create-backup-button"
                    onClick={() => {
                        goto('backup-index', { cancelable: true });
                        analytics.report({
                            type: 'settings/device/goto/backup',
                        });
                    }}
                    isDisabled={isDeviceLocked || !needsBackup}
                >
                    {needsBackup ? (
                        <Translation id="TR_CREATE_BACKUP" />
                    ) : (
                        <Translation id="TR_BACKUP_SUCCESSFUL" />
                    )}
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
