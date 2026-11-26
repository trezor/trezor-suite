import { selectIsConnectionModalOpen, setConnectionModal } from '@suite/device';
import { selectThpStep } from '@suite-common/thp';
import { ModalLoader } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { lazyComponentByName } from '@trezor/lazy-loading';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { reportToSentryThunk } from '#src/utils/suite/sentry';

import { ConnectionGlobalModalProvider } from './context/ConnectionGlobalModalContext';

const { LazyComponent: ConnectDeviceGlobalModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ './ConnectDeviceGlobalModal'),
    'ConnectDeviceGlobalModal',
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
            <ModalLoader
                name="connect-device-global-modal"
                onError={error => {
                    dispatch(reportToSentryThunk(error));
                    closeConnectionModal();
                }}
            >
                <ConnectDeviceGlobalModal onCancel={closeConnectionModal} />
            </ModalLoader>
        </ConnectionGlobalModalProvider>
    );
};
