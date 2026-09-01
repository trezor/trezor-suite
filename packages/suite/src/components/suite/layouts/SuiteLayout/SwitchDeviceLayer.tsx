import { closeModalApp } from '@suite/router';
import {
    TurnOnSuiteSyncModals,
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from '@suite/suite-sync';
import { useDispatch } from '@suite-common/redux-utils';

import { ThpGlobalModalManager } from 'src/components/connection/thp/ThpGlobalModalManager';
import { usePreferredModal, useSelector } from 'src/hooks/suite';
import { SwitchDevice } from 'src/views/suite/SwitchDevice/SwitchDevice';

export const SwitchDeviceLayer = () => {
    const modal = usePreferredModal();
    const dispatch = useDispatch();
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

    if (modal.type !== 'foreground-app' || modal.payload.app !== 'switch-device') return null;

    return (
        <>
            <SwitchDevice
                cancelable={modal.payload.cancelable}
                onCancel={() => dispatch(closeModalApp())}
            />
            <TurnOnSuiteSyncModals
                deviceStaticSessionId={deviceStaticSessionId}
                onClose={() => {
                    dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId: null }));
                }}
            />
            {/*
             * THP flow can be triggered by auto-connect and that will open THP modals.
             * However, this ForegroundApp takes precedence and prevents ALL other modals
             * from rendering, so we have to render it here as well.
             */}
            <ThpGlobalModalManager />
        </>
    );
};
