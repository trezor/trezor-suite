import { Translation } from '@suite/intl';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const MultiShareBackupInProgress = () => (
    <TroubleshootingTips
        label={<Translation id="TR_MULTI_SHARE_BACKUP_IN_PROGRESS" />}
        intent="info"
        items={[
            {
                key: 'multi-share-backup-in-progress',
                heading: <Translation id="TR_MULTI_SHARE_BACKUP_IN_PROGRESS_HEADING" />,
                description: <Translation id="TR_MULTI_SHARE_BACKUP_IN_PROGRESS_DESCRIPTION" />,
                icon: 'recoverySeed',
            },
        ]}
    />
);
