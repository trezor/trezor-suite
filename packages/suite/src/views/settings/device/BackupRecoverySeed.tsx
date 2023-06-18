import React from 'react';
import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useDevice, useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface BackupRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const BackupRecoverySeed = ({ isDeviceLocked }: BackupRecoverySeedProps) => {
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.BackupRecoverySeed);

    const needsBackup = !!device?.features?.needs_backup;
    return (
        <SectionItem
            data-test="@settings/device/backup-recovery-seed"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                buttonLink={HELP_CENTER_RECOVERY_SEED_URL}
            />
            <ActionColumn>
                <ActionButton
                    data-test="@settings/device/create-backup-button"
                    onClick={() => goto('backup-index', { params: { cancelable: true } })}
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
