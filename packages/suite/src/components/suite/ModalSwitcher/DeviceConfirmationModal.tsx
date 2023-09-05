import { MODAL } from 'src/actions/suite/constants';
import { ConfirmNoBackup } from 'src/components/suite/modals';

import type { ReduxModalProps } from './types';

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE_CONFIRMATION>) => {
    switch (windowType) {
        case 'no-backup':
            return <ConfirmNoBackup />;
        default:
            return null;
    }
};
