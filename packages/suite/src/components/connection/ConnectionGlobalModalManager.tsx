import { selectIsConnectionModalOpen, setConnectionModal } from '@suite/device';
import { useDispatch } from '@suite-common/redux-utils';
import { selectThpStep } from '@suite-common/thp';

import { useSelector } from 'src/hooks/suite';

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
