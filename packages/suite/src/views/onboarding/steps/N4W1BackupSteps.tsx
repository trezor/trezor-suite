import { InitialBackupFlow } from '@suite/backup';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from '../../../hooks/suite';
import { selectBackupStatus } from '../../../reducers/backup/backupReducer';

export const N4W1BackupSteps = () => {
    const backupStatus = useSelector(selectBackupStatus);

    switch (backupStatus) {
        case 'initial':
            return <InitialBackupFlow />;
        case 'in-progress':
            return <div>Backup in progress</div>;
        case 'finished':
            return <div>Backup finished</div>;
        case 'error':
            return <div>Backup error</div>;
        default:
            return exhaustive(backupStatus);
    }
};
