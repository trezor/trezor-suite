import { HELP_CENTER_FAILED_BACKUP_URL } from '@trezor/urls';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
                buttonLink={HELP_CENTER_FAILED_BACKUP_URL}
            />
            <ActionColumn>
                <ActionButton isDisabled>
                    <Translation id="TR_BACKUP_FAILED" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
