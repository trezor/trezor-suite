import { useTranslation } from '@suite/intl';
import { MODAL_CONTEXT_DEVICE, MODAL_CONTEXT_DEVICE_CONFIRMATION, closeModal } from '@suite/modal';
import {
    TurnOnSuiteSyncModals,
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from '@suite/suite-sync';
import { ReduxModal } from '@suite-app/app-modal';
import { ModalLoader } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import {
    ConnectionGlobalModalManager,
    ThpGlobalModalManager,
    WipedBleDeviceNeedsManualOsRemovalModalManager,
    reportToSentryThunk,
    usePreferredModal,
    useSelector,
} from '@trezor/suite';

import { ForegroundAppModal } from './ForegroundAppModal';

type ModalParams = ReturnType<typeof usePreferredModal>;

type InnerProps = { modal: ModalParams; onError: (error: Error) => void };

const Inner = ({ modal, onError }: InnerProps) => {
    switch (modal.type) {
        case 'redux-modal':
            /**
             * ReduxModal's switches load their modals lazily; this is their only render site.
             * `ModalLoader` keeps a failed chunk from reaching the app's own boundary.
             */
            return (
                <ModalLoader name={modal.payload.context} onError={onError}>
                    <ReduxModal {...modal.payload} />
                </ModalLoader>
            );
        default:
            return null;
    }
};

/** Displays whichever redux modal or foreground app should be displayed */
export const ModalSwitcher = () => {
    const modal = usePreferredModal();
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

    const reportModalError = (error: Error) => dispatch(reportToSentryThunk(error));

    const isDeviceDriven =
        modal.type === 'redux-modal' &&
        (modal.payload.context === MODAL_CONTEXT_DEVICE ||
            modal.payload.context === MODAL_CONTEXT_DEVICE_CONFIRMATION);

    /**
     * A failed chunk cannot be retried until the page reloads, so close the modal instead of
     * leaving it stuck. A device-driven modal is cancelled too, or the device keeps prompting
     * for an answer that no UI is waiting for any more.
     */
    const handleModalError = (error: Error) => {
        reportModalError(error);

        if (isDeviceDriven) {
            TrezorConnect.cancel({ reason: translationString('TR_CANCELLED') });
        }

        dispatch(closeModal());
    };

    // For foreground apps, we have to NOT render the other modals.
    // There may be conflicts: for example, Firmware Install / Upgrade flow
    // handles the THP separately.
    if (modal.type === 'foreground-app') {
        return <ForegroundAppModal {...modal.payload} />;
    }

    return (
        <>
            <WipedBleDeviceNeedsManualOsRemovalModalManager />
            <ThpGlobalModalManager />
            <TurnOnSuiteSyncModals
                deviceStaticSessionId={deviceStaticSessionId}
                onClose={() => {
                    dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId: null }));
                }}
                onError={reportModalError}
            />
            <ConnectionGlobalModalManager />
            <Inner modal={modal} onError={handleModalError} />
        </>
    );
};
