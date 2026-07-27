import { selectBackupStatus } from '@suite/backup';
import { Translation } from '@suite/intl';
import { isArrayMember } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

const nonErrorBackupStatuses = ['initial', 'in-progress', 'finished'] as const;

export const BackupStepDescription = () => {
    const backupStatus = useSelector(selectBackupStatus);
    const currentProgressBarStep = isArrayMember(backupStatus, nonErrorBackupStatuses)
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
