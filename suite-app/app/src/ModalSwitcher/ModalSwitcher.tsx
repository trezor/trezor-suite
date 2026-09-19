import { Suspense } from 'react';

import {
    TurnOnSuiteSyncModals,
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from '@suite/suite-sync';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import {
    ConnectionGlobalModalManager,
    ReduxModal,
    ThpGlobalModalManager,
    WipedBleDeviceNeedsManualOsRemovalModalManager,
    usePreferredModal,
    useSelector,
} from '@trezor/suite';

import { ForegroundAppModal } from './ForegroundAppModal';

type ModalParams = ReturnType<typeof usePreferredModal>;

type InnerProps = { modal: ModalParams };

const Inner = ({ modal }: InnerProps) => {
    switch (modal.type) {
        case 'redux-modal':
            // ReduxModal's switches load their modals lazily; this is their only render site.
            return (
                <Suspense fallback={null}>
                    <ReduxModal {...modal.payload} />
                </Suspense>
            );
        default:
            return null;
    }
};

/** Displays whichever redux modal or foreground app should be displayed */
export const ModalSwitcher = () => {
    const modal = usePreferredModal();
    const { dispatch } = useServices(injectDispatch);
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

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
            />
            <ConnectionGlobalModalManager />
            <Inner modal={modal} />
        </>
    );
};
