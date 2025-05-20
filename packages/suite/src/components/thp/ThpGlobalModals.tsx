import { selectThpStep } from '@suite-common/thp';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

import { ThpAutoconnectInfoModal } from './ThpAutoconnectInfoModal';
import { ThpAutoconnectionModal } from './ThpAutoconnectionModal';
import { ThpConnectionModal } from './ThpConnectionModal';
import { ThpPairingFailedModal } from './ThpPairingFailedModal';
import { useSelector } from '../../hooks/suite';
import { ThpPairingPinEntryModal } from '../suite/modals/ReduxModal/DeviceContextModal/ThpPairingPinEntryModal';

export const ThpGlobalModals = () => {
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);

    if (device === undefined || thpStep === null) {
        return null;
    }

    switch (thpStep) {
        // Not relevant here, used only in Firmware Installation
        case 'BeforeConnectionInfo':
            return null;

        // User needs to confirm Connection. We also know that the THP pairing will follow
        case 'Pairing':
            return <ThpConnectionModal device={device} />;

        // Connection, where we know, that no THP pairing will follow
        case 'Connection':
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
};
