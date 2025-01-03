import { BackupStatus } from '../../actions/backup/backupActions';
import { Translation } from '../../components/suite';

const nonErrorBackupStatuses = ['initial', 'in-progress', 'finished'] as const;

export const BackupStepDescription = ({ backupStatus }: { backupStatus: BackupStatus }) => {
    const currentProgressBarStep = nonErrorBackupStatuses.some(status => status === backupStatus)
        ? nonErrorBackupStatuses.findIndex(s => s === backupStatus) + 1
        : undefined;

    return (
        currentProgressBarStep && (
            <Translation
                id="TR_STEP_OF_TOTAL"
                values={{
                    index: currentProgressBarStep,
                    total: nonErrorBackupStatuses.length,
                }}
            />
        )
    );
};
