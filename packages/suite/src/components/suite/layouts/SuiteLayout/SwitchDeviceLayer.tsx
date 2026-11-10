import { closeModalAppThunk } from '@suite/router';
import {
    TurnOnSuiteSyncModals,
    selectShowEnableSuiteSyncModal,
    updateShowEnableSuiteSyncModal,
} from '@suite/suite-sync';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { usePreferredModal, useSelector } from '../../../../hooks/suite';
import { SwitchDevice } from '../../../../views/suite/SwitchDevice/SwitchDevice';
import { ThpGlobalModalManager } from '../../../connection/thp/ThpGlobalModalManager';

export const SwitchDeviceLayer = () => {
    const modal = usePreferredModal();
    const { dispatch } = useServices(injectDispatch);
    const deviceStaticSessionId = useSelector(selectShowEnableSuiteSyncModal);

    if (modal.type !== 'foreground-app' || modal.payload.app !== 'switch-device') return null;

    return (
        <>
            <SwitchDevice
                cancelable={modal.payload.cancelable}
                onCancel={() => dispatch(closeModalAppThunk())}
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
