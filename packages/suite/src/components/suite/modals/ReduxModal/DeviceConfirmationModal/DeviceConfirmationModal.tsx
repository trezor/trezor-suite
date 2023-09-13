import { MODAL } from 'src/actions/suite/constants';
import { NoBackupModal } from 'src/components/suite/modals';

import type { ReduxModalProps } from '../ReduxModal';

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE_CONFIRMATION>) => {
    switch (windowType) {
        case 'no-backup':
            return <NoBackupModal />;
        default:
            return null;
    }
};
