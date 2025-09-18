import { useSelector } from 'react-redux';

import { selectThpStep } from '@suite-common/thp';
import { selectSelectedFirstThpDevice } from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

import { ThpPairingPinEntryModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ThpPairingPinEntryModal';

import { ThpAutoconnectInfoModal } from './ThpAutoconnectInfoModal';
import { ThpAutoconnectionModal } from './ThpAutoconnectionModal';
import { ThpConnectionModal } from './ThpConnectionModal';
import { ThpPairingFailedModal } from './ThpPairingFailedModal';

export const ThpGlobalManager = () => {
    const device = useSelector(selectSelectedFirstThpDevice);
    const thpStep = useSelector(selectThpStep);

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
                return <ThpAutoconnectInfoModal device={device} />;
            case 'Autoconnect':
                return <ThpAutoconnectionModal device={device} />;
            default:
                return exhaustive(thpStep);
        }
    }
};
