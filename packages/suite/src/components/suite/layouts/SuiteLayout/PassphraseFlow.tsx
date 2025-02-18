import { selectSelectedDevice } from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { MODAL } from '../../../../actions/suite/constants';
import { onCancel as onCancelAction } from '../../../../actions/suite/modalActions';
import { closeModalApp } from '../../../../actions/suite/routerActions';
import { useDispatch, usePreferredModal, useSelector } from '../../../../hooks/suite';
import type { AppState, ForegroundAppRoute } from '../../../../types/suite';
import { SwitchDevice } from '../../../../views/suite/SwitchDevice/SwitchDevice';
import { PassphraseDuplicateModal, PassphraseModal, PassphraseOnDeviceModal } from '../../modals';
import type { ModalProps } from '../../modals/Modal/Modal';
import { DiscoveryLoader } from '../../modals/ModalSwitcher/DiscoveryLoader';
import { usePassphraseModalContext } from '../../modals/ReduxModal/DeviceContextModal/PassphraseModalContext';
import { PassphraseMismatchModal } from '../../modals/ReduxModal/UserContextModal/PassphraseMismatchModal';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE>) => {
    const device = useSelector(selectSelectedDevice);

    if (!device) return null;

    switch (windowType) {
        // Passphrase on host
        case UI.REQUEST_PASSPHRASE:
            return <PassphraseModal device={device} />;

        // T2T1 firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDeviceModal device={device} />;
        default:
            return null;
    }
};

export const UserContextModal = ({ payload }: ReduxModalProps<typeof MODAL.CONTEXT_USER>) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(onCancelAction());
    const { setPassphraseState, isExisting } = usePassphraseModalContext();

    switch (payload.type) {
        case 'passphrase-duplicate':
            if (isExisting) {
                setPassphraseState('exists-passphrase-duplicate');
            } else {
                setPassphraseState('not-exist-passphrase-duplicate');
            }

            return (
                <PassphraseDuplicateModal device={payload.device} duplicate={payload.duplicate} />
            );

        case 'passphrase-mismatch-warning':
            if (isExisting) {
                setPassphraseState('exists-passphrase-mismatch');
            } else {
                setPassphraseState('not-exist-passphrase-mismatch');
            }

            return <PassphraseMismatchModal onCancel={onCancel} />;
    }
};

export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL.CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }> & {
    renderer?: ModalProps['renderer'];
};

/** Modals initiated by redux state.modal */
export const ReduxModal = (modal: ReduxModalProps) => {
    switch (modal.context) {
        case MODAL.CONTEXT_DEVICE: // Modals requested by Device from `trezor-connect`
            return <DeviceContextModal {...modal} />;
        case MODAL.CONTEXT_USER: // Modals opened as result of user action
            return <UserContextModal {...modal} />;
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

    if (app === 'switch-device')
        return <SwitchDevice cancelable={cancelable} onCancel={onCancel} />;
};

const ModalSwitcher = () => {
    const modal = usePreferredModal();

    switch (modal.type) {
        case 'foreground-app':
            return <ForegroundAppModal {...modal.payload} />;
        case 'redux-modal':
            return <ReduxModal {...modal.payload} />;
        case 'discovery-loading':
            return <DiscoveryLoader />;
        default:
            return null;
    }
};

export const PassphraseFlow = () => <ModalSwitcher />;
