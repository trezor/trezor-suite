import { Modal } from '@trezor/components';

import { Loading } from 'src/components/suite';

import { BackupStepDescription } from './BackupStepDescription';

export const BackupStep2InProgress = ({ onCancel }: { onCancel: () => void }) => (
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
