import { type MODAL_CONTEXT_DEVICE_CONFIRMATION } from '@suite/modal';
import { UI_REQUESTS } from '@trezor/connect';
import { lazyComponentByName } from '@trezor/lazy-loading';

import type { ReduxModalProps } from '../ReduxModalProps';

const { LazyComponent: NoBackupModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './NoBackupModal'),
    'NoBackupModal',
);
const { LazyComponent: SelectFeeModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './SelectFeeModal'),
    'SelectFeeModal',
);

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
    data,
}: ReduxModalProps<typeof MODAL_CONTEXT_DEVICE_CONFIRMATION>) => {
    switch (windowType) {
        case UI_REQUESTS.REQUEST_FEE:
            return data ? <SelectFeeModal data={data} /> : null;
        case 'no-backup':
            return <NoBackupModal />;
        default:
            return null;
    }
};
