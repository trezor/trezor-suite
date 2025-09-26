import { selectThpStep } from '@suite-common/thp';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

import { selectIsConnectionModalOpen } from 'src/actions/device/deviceSelectors';
import { setConnectionModal } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { ConnectDeviceGlobalModal } from './ConnectDeviceGlobalModal';
import { ThpAutoconnectInfoModal } from './thp/ThpAutoconnectInfoModal';
import { ThpAutoconnectionModal } from './thp/ThpAutoconnectionModal';
import { ThpConnectionModal } from './thp/ThpConnectionModal';
import { ThpPairingFailedModal } from './thp/ThpPairingFailedModal';
import { ThpPairingPinEntryModal } from '../suite/modals/ReduxModal/DeviceContextModal/ThpPairingPinEntryModal';

type ConnectionGlobalModalProps = {
    /** @deprecated Should be removed once we get rid of onboarding fullscreen app logic. */
    showThpModals?: boolean;
};

export const ConnectionGlobalModal = ({ showThpModals = true }: ConnectionGlobalModalProps) => {
    const dispatch = useDispatch();
    const isConnectDeviceModalOpen = useSelector(selectIsConnectionModalOpen);
    const device = useSelector(selectSelectedDevice);
    const thpStepState = useSelector(selectThpStep);

    const closeConnectionModal = () => {
        dispatch(setConnectionModal(false));
    };

    const thpStep = device !== undefined ? thpStepState[device.path] : null;

    // handle THP modals first if we have a device and thpStep
    if (device !== undefined && thpStep !== null && showThpModals) {
        switch (thpStep.step) {
            case 'BeforeConnectionInfo':
                return null;
            case 'ConfirmConnectionBeforePairing':
                return <ThpConnectionModal device={device} />;
            case 'ConfirmOnlyConnection':
                return <ThpConnectionModal device={device} />;
            case 'CodeEntry':
                return <ThpPairingPinEntryModal device={device} />;
            case 'CodeInvalid':
                return <ThpPairingFailedModal device={device} />;
            case 'AutoconnectInfo':
                return <ThpAutoconnectInfoModal device={device} />;
            case 'Autoconnect':
                return <ThpAutoconnectionModal device={device} />;
            default:
                return exhaustive(thpStep.step);
        }
    }

    if (!isConnectDeviceModalOpen) return null;

    return <ConnectDeviceGlobalModal onCancel={closeConnectionModal} />;
};
