import { selectSelectedDevice } from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { MODAL } from '../../../../actions/suite/constants';
import { closeModalApp } from '../../../../actions/suite/routerActions';
import { useDispatch, usePreferredModal, useSelector } from '../../../../hooks/suite';
import type { AppState, ForegroundAppRoute } from '../../../../types/suite';
import { SwitchDevice } from '../../../../views/suite/SwitchDevice/SwitchDevice';
import { PassphraseModal, PassphraseOnDeviceModal } from '../../modals';
import { ConfirmPassphraseBeforeAction } from '../../modals/ReduxModal/DeviceContextModal/ConfirmPassphraseBeforeAction';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE>) => {
    const device = useSelector(selectSelectedDevice);

    if (!device) return null;

    switch (windowType) {
        // T2T1 firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDeviceModal device={device} />;
        default:
            return null;
    }
};

export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL.CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }>;

/** Modals initiated by redux state.modal */
export const ReduxModal = (modal: ReduxModalProps) => {
    switch (modal.context) {
        case MODAL.CONTEXT_DEVICE: // Modals requested by Device from `trezor-connect`
            return <DeviceContextModal {...modal} />;
        default:
            return null;
    }
};

type ForegroundAppModalProps = {
    app: ForegroundAppRoute['app'];
    cancelable: boolean;
};

const ForegroundAppModal = ({ app, cancelable }: ForegroundAppModalProps) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(closeModalApp());

    if (app === 'switch-device') {
        return <SwitchDevice cancelable={cancelable} onCancel={onCancel} />;
    }
};

export const PassphraseFlow = () => {
    const { type, payload } = usePreferredModal();
    const device = useSelector(selectSelectedDevice);

    switch (type) {
        case 'foreground-app':
            return <ForegroundAppModal {...payload} />;
        case 'redux-modal':
            return <ReduxModal {...payload} />;
        case 'passphrase-flow':
            return device ? <PassphraseModal device={device} /> : null;
        case 'device-request-passphrase':
            return <ConfirmPassphraseBeforeAction />;

        default:
            return null;
    }
};
