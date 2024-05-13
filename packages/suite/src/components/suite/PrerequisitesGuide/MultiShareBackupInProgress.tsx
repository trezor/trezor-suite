import { Translation, TroubleshootingTips } from 'src/components/suite';

export const MultiShareBackupInProgress = () => {
    return (
        <TroubleshootingTips
            label={<Translation id="TR_MULTI_SHARE_BACKUP_IN_PROGRESS" />}
            items={[
                {
                    key: 'multi-share-backup-in-progress',
                    heading: <Translation id="TR_MULTI_SHARE_BACKUP_IN_PROGRESS_HEADING" />,
                    description: <Translation id="TR_MULTI_SHARE_BACKUP_IN_PROGRESS_DESCRIPTION" />,
                },
            ]}
        />
    );
};
