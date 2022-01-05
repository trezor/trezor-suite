import React from 'react';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { FAILED_BACKUP_URL } from '@suite-constants/urls';

const BackupFailed = () => (
    <SectionItem data-test="@settings/device/failed-backup-row">
        <TextColumn
            title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
            description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
            learnMore={FAILED_BACKUP_URL}
        />
        <ActionColumn>
            <ActionButton isDisabled>
                <Translation id="TR_BACKUP_FAILED" />
            </ActionButton>
        </ActionColumn>
    </SectionItem>
);

export default BackupFailed;
