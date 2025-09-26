import { UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';

import { SelectAccountModal } from './SelectAccountModal';
import { SelectFeeModal } from './SelectFeeModal';
import type { ReduxModalProps } from '../ReduxModal';
import { NoBackupModal } from './NoBackupModal';

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
    data,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE_CONFIRMATION>) => {
    switch (windowType) {
        case UI.SELECT_ACCOUNT:
            return data ? <SelectAccountModal data={data} /> : null;
        case UI.SELECT_FEE:
            return data ? <SelectFeeModal data={data} /> : null;
        case 'no-backup':
            return <NoBackupModal />;
        default:
            return null;
    }
};
