import { selectBackupStatus } from '@suite/backup';
import { Translation } from '@suite/intl';

import { useSelector } from 'src/hooks/suite';

const nonErrorBackupStatuses = ['initial', 'in-progress', 'finished'] as const;

export const BackupStepDescription = () => {
    const backupStatus = useSelector(selectBackupStatus);
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
