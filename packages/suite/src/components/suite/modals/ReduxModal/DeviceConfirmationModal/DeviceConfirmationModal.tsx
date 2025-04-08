import { UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';
import { NoBackupModal } from 'src/components/suite/modals';

import { SelectAccountModal } from './SelectAccountModal';
import type { ReduxModalProps } from '../ReduxModal';

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
    data,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE_CONFIRMATION>) => {
    switch (windowType) {
        case UI.SELECT_ACCOUNT:
            return data ? <SelectAccountModal data={data} /> : null;
        case 'no-backup':
            return <NoBackupModal />;
        default:
            return null;
    }
};
