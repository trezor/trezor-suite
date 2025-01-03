import { NewModal } from '@trezor/components';

import { Loading } from 'src/components/suite';

import { BackupStepDescription } from './BackupStepDescription';
import { BackupState } from '../../reducers/backup/backupReducer';

export const BackupStep2InProgress = ({
    onCancel,
    backup,
}: {
    onCancel: () => void;
    backup: BackupState;
}) => {
    return (
        <NewModal
            onCancel={onCancel}
            variant="primary"
            data-testid="@backup"
            heading={null}
            description={<BackupStepDescription backupStatus={backup.status} />}
        >
            <Loading />
        </NewModal>
    );
};
