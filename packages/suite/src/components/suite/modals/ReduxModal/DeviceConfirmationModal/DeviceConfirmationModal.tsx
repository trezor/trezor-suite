import { lazy } from 'react';

import { type MODAL_CONTEXT_DEVICE_CONFIRMATION } from '@suite/modal';
import { UI_REQUESTS } from '@trezor/connect';

import type { ReduxModalProps } from '../ReduxModalProps';

const NoBackupModal = lazy(() =>
    import(/* webpackChunkName: "modals-device" */ './NoBackupModal').then(m => ({
        default: m.NoBackupModal,
    })),
);
const SelectAccountModal = lazy(() =>
    import(/* webpackChunkName: "modals-device" */ './SelectAccountModal').then(m => ({
        default: m.SelectAccountModal,
    })),
);
const SelectFeeModal = lazy(() =>
    import(/* webpackChunkName: "modals-device" */ './SelectFeeModal').then(m => ({
        default: m.SelectFeeModal,
    })),
);

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
