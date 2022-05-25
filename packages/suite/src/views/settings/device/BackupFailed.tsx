import React from 'react';
import { WIKI_FAILED_BACKUP_URL } from '@trezor/urls';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const BackupFailed = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.BackupFailed);

    return (
        <SectionItem
            data-test="@settings/device/failed-backup-row"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
                description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
                buttonLink={WIKI_FAILED_BACKUP_URL}
            />
            <ActionColumn>
                <ActionButton isDisabled>
                    <Translation id="TR_BACKUP_FAILED" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
