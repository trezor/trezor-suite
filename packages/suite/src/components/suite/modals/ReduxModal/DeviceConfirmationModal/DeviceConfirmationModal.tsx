import { type MODAL_CONTEXT_DEVICE_CONFIRMATION } from '@suite/modal';
import { UI_REQUESTS } from '@trezor/connect';

import { NoBackupModal } from './NoBackupModal';
import { SelectAccountModal } from './SelectAccountModal';
import { SelectFeeModal } from './SelectFeeModal';
import type { ReduxModalProps } from '../ReduxModalProps';

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
    data,
}: ReduxModalProps<typeof MODAL_CONTEXT_DEVICE_CONFIRMATION>) => {
    switch (windowType) {
        case UI_REQUESTS.REQUEST_ACCOUNT:
            return data ? <SelectAccountModal data={data} /> : null;
        case UI_REQUESTS.REQUEST_FEE:
            return data ? <SelectFeeModal data={data} /> : null;
        case 'no-backup':
            return <NoBackupModal />;
        default:
            return null;
    }
};
