import { Suspense, lazy } from 'react';

import { selectIsConnectionModalOpen, setConnectionModal } from '@suite/device';
import { selectThpStep } from '@suite-common/thp';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

import { ConnectionGlobalModalProvider } from './context/ConnectionGlobalModalContext';

const ConnectDeviceGlobalModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ './ConnectDeviceGlobalModal').then(m => ({
        default: m.ConnectDeviceGlobalModal,
    })),
);

export const ConnectionGlobalModalManager = () => {
    const { dispatch } = useServices(injectDispatch);
    const isConnectDeviceModalOpen = useSelector(selectIsConnectionModalOpen);
    const thpStep = useSelector(selectThpStep);

    const closeConnectionModal = () => {
        dispatch(setConnectionModal(false));
    };

    if (!isConnectDeviceModalOpen || thpStep !== null) return null;

    return (
        <ConnectionGlobalModalProvider>
            <Suspense fallback={null}>
                <ConnectDeviceGlobalModal onCancel={closeConnectionModal} />
            </Suspense>
        </ConnectionGlobalModalProvider>
    );
};
