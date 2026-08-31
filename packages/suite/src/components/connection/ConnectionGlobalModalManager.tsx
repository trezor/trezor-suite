import { useDispatch } from 'react-redux';

import { selectIsConnectionModalOpen, setConnectionModal } from '@suite/device';
import { useSelector } from '@suite-common/redux-utils';
import { selectThpStep } from '@suite-common/thp';

import { ConnectDeviceGlobalModal } from './ConnectDeviceGlobalModal';
import { ConnectionGlobalModalProvider } from './context/ConnectionGlobalModalContext';

export const ConnectionGlobalModalManager = () => {
    const dispatch = useDispatch();
    const isConnectDeviceModalOpen = useSelector(selectIsConnectionModalOpen);
    const thpStep = useSelector(selectThpStep);

    const closeConnectionModal = () => {
        dispatch(setConnectionModal(false));
    };

    if (!isConnectDeviceModalOpen || thpStep !== null) return null;

    return (
        <ConnectionGlobalModalProvider>
            <ConnectDeviceGlobalModal onCancel={closeConnectionModal} />
        </ConnectionGlobalModalProvider>
    );
};
