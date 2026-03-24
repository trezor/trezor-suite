import { MODAL_CONTEXT_DEVICE, type MODAL_CONTEXT_NONE } from '@suite/modal';
import { closeModalApp } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { UI_REQUEST } from '@trezor/connect';

import {
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from 'src/actions/suiteSync/suiteSyncSlice';

import { useDispatch, usePreferredModal, useSelector } from '../../../../hooks/suite';
import type { AppState, ForegroundAppRoute } from '../../../../types/suite';
import { SwitchDevice } from '../../../../views/suite/SwitchDevice/SwitchDevice';
import { ThpGlobalModalManager } from '../../../connection/thp/ThpGlobalModalManager';
import { TurnOnSuiteSyncModals } from '../../labeling/TurnOnSuiteSync/TurnOnSuiteSyncModals';
import { ConfirmPassphraseBeforeAction } from '../../modals/ReduxModal/DeviceContextModal/ConfirmPassphraseBeforeAction';
import { PassphraseModal } from '../../modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { PassphraseOnDeviceModal } from '../../modals/ReduxModal/DeviceContextModal/PassphraseOnDeviceModal';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
}: ReduxModalProps<typeof MODAL_CONTEXT_DEVICE>) => {
    const device = useSelector(selectSelectedDevice);

    if (!device) return null;

    switch (windowType) {
        // T2T1 firmware
        case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDeviceModal device={device} />;
        default:
            return null;
    }
};

export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL_CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }>;

/** Modals initiated by redux state.modal */
export const ReduxModal = (modal: ReduxModalProps) => {
    switch (modal.context) {
        case MODAL_CONTEXT_DEVICE: // Modals requested by Device from `trezor-connect`
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
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

    const onCancel = () => dispatch(closeModalApp());

    // IMPORTANT: This is the place where all the modals that need to rendered OVER
    //            Wallet-Switch needs to be.
    if (app === 'switch-device') {
        return (
            <>
                <SwitchDevice cancelable={cancelable} onCancel={onCancel} />
                <TurnOnSuiteSyncModals
                    deviceStaticSessionId={deviceStaticSessionId}
                    onClose={() => {
                        dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId: null }));
                    }}
                />
                {/* THP flow can be triggered by auto-connect and that will open THP modals.
                 *  However, this ForegroundApp takes precedes and prevents ALL other modals
                 *  to render. So we have to render it here as well.*/}
                <ThpGlobalModalManager />
            </>
        );
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
