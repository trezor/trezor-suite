import { Modal } from '@trezor/components';

import { BackupStepDescription } from './BackupStepDescription';
import { Loading } from '../../components/suite';

type BackupStep2InProgressProps = { onCancel: () => void };

export const BackupStep2InProgress = ({ onCancel }: BackupStep2InProgressProps) => (
    <Modal
        onCancel={onCancel}
        intent="brand"
        data-testid="@backup"
        heading={null}
        description={<BackupStepDescription />}
    >
        <Loading />
    </Modal>
);
