import { selectThpStep } from '@suite-common/thp';
import {
    deviceActions,
    selectIsConnectionModalOpen,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { ConnectDeviceGlobalModal } from './ConnectDeviceGlobalModal';
import { ThpAutoconnectInfoModal } from './thp/ThpAutoconnectInfoModal';
import { ThpAutoconnectionModal } from './thp/ThpAutoconnectionModal';
import { ThpConnectionModal } from './thp/ThpConnectionModal';
import { ThpPairingFailedModal } from './thp/ThpPairingFailedModal';
import { ThpPairingPinEntryModal } from '../suite/modals/ReduxModal/DeviceContextModal/ThpPairingPinEntryModal';

export const ConnectionGlobalModal = () => {
    const dispatch = useDispatch();
    const isConnectDeviceModalOpen = useSelector(selectIsConnectionModalOpen);
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);

    const toggleConnectionModal = () => {
        dispatch(deviceActions.toggleConnectionModal());
    };

    // handle THP modals first if we have a device and thpStep
    if (device !== undefined && thpStep !== null) {
        switch (thpStep) {
            case 'BeforeConnectionInfo':
                return null;
            case 'ConfirmConnectionBeforePairing':
                return <ThpConnectionModal device={device} />;
            case 'ConfirmOnlyConnection':
                return <ThpConnectionModal device={device} />;
            case 'CodeEntry':
                return <ThpPairingPinEntryModal />;
            case 'CodeInvalid':
                return <ThpPairingFailedModal />;
            case 'AutoconnectInfo':
                return <ThpAutoconnectInfoModal />;
            case 'Autoconnect':
                return <ThpAutoconnectionModal device={device} />;
            default:
                return exhaustive(thpStep);
        }
    }

    if (!isConnectDeviceModalOpen) return null;

    return <ConnectDeviceGlobalModal onCancel={toggleConnectionModal} />;
};
